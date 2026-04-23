<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";

// This endpoint is intentionally resilient:
// - If AI keys are missing or providers fail, we always return a valid JSON response.

/**
 * Ensure BYOK storage exists before reading a user's saved provider key.
 */
function ensureUserAiKeysTable(PDO $pdo): void
{
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

    if ($driver === "sqlite") {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS user_ai_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                api_key_encrypted TEXT NOT NULL,
                iv TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        ");
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS user_ai_keys (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            provider VARCHAR(50) NOT NULL,
            model VARCHAR(150) NOT NULL,
            api_key_encrypted TEXT NOT NULL,
            iv VARCHAR(32) NOT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user (user_id)
        );
    ");
}

/**
 * Cache writes are best-effort, but the table should exist anywhere this
 * endpoint is deployed so teammates do not need manual SQL setup.
 */
function ensureAiPriorityCacheTable(PDO $pdo): void
{
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

    if ($driver === "sqlite") {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS ai_priority_cache (
                cache_key TEXT PRIMARY KEY,
                priority TEXT NOT NULL,
                explanation TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        ");
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_priority_cache (
            cache_key CHAR(64) PRIMARY KEY,
            priority VARCHAR(20) NOT NULL,
            explanation TEXT NOT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        );
    ");
}

/**
 * BYOK uses one app-level encryption secret to decrypt the saved provider key
 * before sending the bug triage request to the user's chosen provider.
 */
function getByokEncryptKey(): ?string
{
    $envValue = getenv("BYOK_ENCRYPT_KEY");
    if (is_string($envValue)) {
        $envValue = trim($envValue);
        if (preg_match('/^[a-f0-9]{32}$/i', $envValue) === 1) {
            return $envValue;
        }
    }

    if (defined("BYOK_ENCRYPT_KEY")) {
        $configValue = trim((string)BYOK_ENCRYPT_KEY);
        if (preg_match('/^[a-f0-9]{32}$/i', $configValue) === 1) {
            return $configValue;
        }
    }

    return null;
}

function sendJson(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function getRequestJson(): array
{
    $raw = file_get_contents("php://input");
    if ($raw === false || $raw === "") return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function pruneAndCountRateLimit(int $maxPerMinute): int
{
    $now = time();
    $windowStart = $now - 60;

    if (!isset($_SESSION["priority_suggest_timestamps"]) || !is_array($_SESSION["priority_suggest_timestamps"])) {
        $_SESSION["priority_suggest_timestamps"] = [];
    }

    // Keep only calls within last 60s
    $_SESSION["priority_suggest_timestamps"] = array_values(
        array_filter(
            $_SESSION["priority_suggest_timestamps"],
            static function ($ts) use ($windowStart): bool {
                return is_int($ts) && $ts >= $windowStart;
            }
        )
    );

    $count = count($_SESSION["priority_suggest_timestamps"]);
    if ($count >= $maxPerMinute) return $count;

    $_SESSION["priority_suggest_timestamps"][] = $now;
    return $count + 1;
}

function countSentences(string $text): int
{
    $text = trim($text);
    if ($text === "") return 0;
    $parts = preg_split('/[.!?]+/', $text);
    if (!is_array($parts)) return 0;
    $sentences = 0;
    foreach ($parts as $p) {
        if (trim($p) !== "") $sentences++;
    }
    return $sentences;
}

function buildFallbackTriageNote(string $title, string $codeReference): string
{
    $safeTitle = trim($title);
    $safeCode = trim($codeReference);
    $lookAt = $safeCode !== ""
        ? "Inspect " . $safeCode . " and closely related call paths."
        : "Inspect the module most directly related to the bug title and user action flow.";

    return "- Look at: " . $lookAt . "\n"
        . "- Likely cause: state sync issue, edge-case validation, or an incorrect API response mapping.\n"
        . "- First checks: reproduce with logs, verify request/response payloads, and confirm expected state updates after the action \"" . ($safeTitle !== "" ? $safeTitle : "this bug") . "\".";
}

function isStructuredTriageNote(string $note): bool
{
    return stripos($note, "- Look at:") !== false
        && stripos($note, "- Likely cause:") !== false
        && stripos($note, "- First checks:") !== false;
}

function validateAndNormalizeResult(array $result): ?array
{
    $allowed = ["high", "medium", "low"];
    $priorityRaw = $result["priority"] ?? null;
    $explanationRaw = $result["explanation"] ?? null;
    $triageRaw = $result["triage_note"] ?? null;

    if (!is_string($priorityRaw) || !is_string($explanationRaw)) return null;

    $priority = strtolower(trim($priorityRaw));
    $explanation = trim($explanationRaw);

    if (!in_array($priority, $allowed, true)) return null;

    // Must be 1–2 sentences
    $sentences = countSentences($explanation);
    if ($sentences < 1 || $sentences > 2) return null;

    // Avoid huge payloads from providers
    if (mb_strlen($explanation) > 600) return null;

    $triageNote = null;
    if (is_string($triageRaw)) {
        $triageTrimmed = trim($triageRaw);
        if ($triageTrimmed !== "" && mb_strlen($triageTrimmed) <= 700 && isStructuredTriageNote($triageTrimmed)) {
            $triageNote = $triageTrimmed;
        }
    }

    return ["priority" => $priority, "explanation" => $explanation, "triage_note" => $triageNote];
}

function extractJsonFromText(string $text): ?array
{
    $text = trim($text);
    if ($text === "") return null;

    // First try direct JSON
    $decoded = json_decode($text, true);
    if (is_array($decoded)) return $decoded;

    // Then extract JSON substring between first { and last }
    $start = strpos($text, "{");
    $end = strrpos($text, "}");
    if ($start === false || $end === false || $end <= $start) return null;

    $candidate = substr($text, $start, $end - $start + 1);
    $decoded2 = json_decode($candidate, true);
    if (is_array($decoded2)) return $decoded2;

    return null;
}

function curlPostJson(string $url, array $headers, array $payload, int $timeoutMs): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_CONNECTTIMEOUT_MS => $timeoutMs,
        CURLOPT_TIMEOUT_MS => $timeoutMs,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $body = curl_exec($ch);
    $errNo = curl_errno($ch);
    $errMsg = $errNo ? curl_error($ch) : "";
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errNo !== 0 || $body === false || $body === "") {
        return ["ok" => false, "status" => $status, "body" => null, "errNo" => $errNo, "errMsg" => $errMsg];
    }

    return ["ok" => true, "status" => $status, "body" => $body, "errNo" => 0, "errMsg" => ""];
}

function callOpenAICompatible(string $baseUrl, string $apiKey, string $model, string $prompt, int $timeoutMs, ?string &$errorOut = null): ?array
{
    // OpenAI-compatible: /chat/completions
    $url = rtrim($baseUrl, "/") . "/chat/completions";

    $payload = [
        "model" => $model,
        "temperature" => 0.2,
        "messages" => [
            [
                "role" => "system",
                "content" => "You are a bug triage assistant. Output EXACTLY valid JSON with keys priority and explanation.",
            ],
            [
                "role" => "user",
                "content" => $prompt,
            ],
        ],
    ];

    $headers = [
        "Content-Type: application/json",
        "Authorization: Bearer " . $apiKey,
    ];

    $res = curlPostJson($url, $headers, $payload, $timeoutMs);
    if (!$res["ok"]) {
        $errorOut = isset($res["errNo"]) && (int)$res["errNo"] !== 0
            ? ("curl_error " . (int)$res["errNo"] . ": " . (string)($res["errMsg"] ?? ""))
            : ("request_failed http_status " . (int)($res["status"] ?? 0));
        return null;
    }
    if ($res["status"] < 200 || $res["status"] >= 300) {
        $errorOut = "http_status " . (int)$res["status"];
        return null;
    }

    $decoded = json_decode((string)$res["body"], true);
    if (!is_array($decoded)) {
        $errorOut = "invalid_json_response";
        return null;
    }

    $content = $decoded["choices"][0]["message"]["content"] ?? null;
    if (!is_string($content)) {
        $errorOut = "missing_message_content";
        return null;
    }

    $json = extractJsonFromText($content);
    if (!is_array($json)) {
        $errorOut = "model_output_not_json";
        return null;
    }

    $validated = validateAndNormalizeResult($json);
    if ($validated === null) {
        $errorOut = "invalid_priority_or_explanation_format";
        return null;
    }

    return $validated;
}

function callClaude(string $apiKey, string $model, string $prompt, int $timeoutMs, ?string &$errorOut = null): ?array
{
    $url = "https://api.anthropic.com/v1/messages";
    $payload = [
        "model" => $model,
        "max_tokens" => 300,
        "temperature" => 0.2,
        "messages" => [["role" => "user", "content" => $prompt]],
    ];
    $headers = [
        "Content-Type: application/json",
        "x-api-key: " . $apiKey,
        "anthropic-version: 2023-06-01",
    ];
    $res = curlPostJson($url, $headers, $payload, $timeoutMs);
    if (!$res["ok"]) {
        $errorOut = isset($res["errNo"]) && (int)$res["errNo"] !== 0
            ? ("curl_error " . (int)$res["errNo"] . ": " . (string)($res["errMsg"] ?? ""))
            : ("request_failed http_status " . (int)($res["status"] ?? 0));
        return null;
    }
    if ($res["status"] < 200 || $res["status"] >= 300) {
        $errorOut = "http_status " . (int)$res["status"];
        return null;
    }
    $decoded = json_decode((string)$res["body"], true);
    if (!is_array($decoded)) {
        $errorOut = "invalid_json_response";
        return null;
    }
    $content = null;
    if (isset($decoded["content"]) && is_array($decoded["content"])) {
        foreach ($decoded["content"] as $block) {
            if (is_array($block) && ($block["type"] ?? "") === "text" && isset($block["text"]) && is_string($block["text"])) {
                $content = $block["text"];
                break;
            }
        }
    }
    if (!is_string($content)) {
        $content = $decoded["content"][0]["text"] ?? null;
    }
    if (!is_string($content)) {
        $errorOut = "missing_text";
        return null;
    }
    $json = extractJsonFromText($content);
    if (!is_array($json)) {
        $errorOut = "model_output_not_json";
        return null;
    }
    $validated = validateAndNormalizeResult($json);
    if ($validated === null) {
        $errorOut = "invalid_format";
        return null;
    }
    return $validated;
}

function callGemini(string $apiKey, string $model, string $prompt, int $timeoutMs, ?string &$errorOut = null): ?array
{
    $url = "https://generativelanguage.googleapis.com/v1beta/models/" . rawurlencode($model) . ":generateContent?key=" . urlencode($apiKey);
    $payload = [
        "contents" => [
            ["parts" => [["text" => $prompt]]],
        ],
        "generationConfig" => [
            "temperature" => 0.2,
            "maxOutputTokens" => 250,
        ],
    ];

    $headers = [
        "Content-Type: application/json",
    ];

    $res = curlPostJson($url, $headers, $payload, $timeoutMs);
    if (!$res["ok"]) {
        $errorOut = isset($res["errNo"]) && (int)$res["errNo"] !== 0
            ? ("curl_error " . (int)$res["errNo"] . ": " . (string)($res["errMsg"] ?? ""))
            : ("request_failed http_status " . (int)($res["status"] ?? 0));
        return null;
    }
    if ($res["status"] < 200 || $res["status"] >= 300) {
        $errorOut = "http_status " . (int)$res["status"];
        return null;
    }

    $decoded = json_decode((string)$res["body"], true);
    if (!is_array($decoded)) {
        $errorOut = "invalid_json_response";
        return null;
    }

    $text = $decoded["candidates"][0]["content"]["parts"][0]["text"] ?? null;
    if (!is_string($text)) {
        $errorOut = "missing_text";
        return null;
    }

    $json = extractJsonFromText($text);
    if (!is_array($json)) {
        $errorOut = "model_output_not_json";
        return null;
    }

    $validated = validateAndNormalizeResult($json);
    if ($validated === null) {
        $errorOut = "invalid_priority_or_explanation_format";
        return null;
    }

    return $validated;
}

function ensureProviderCooldownSession(): void
{
    if (!isset($_SESSION["ai_provider_cooldowns"]) || !is_array($_SESSION["ai_provider_cooldowns"])) {
        $_SESSION["ai_provider_cooldowns"] = [];
    }

    $defaults = [
        "cerebras" => 0,
        "nvidia" => 0,
        "openrouter" => 0,
        "gemini" => 0,
    ];

    foreach ($defaults as $k => $v) {
        if (!array_key_exists($k, $_SESSION["ai_provider_cooldowns"]) || !is_int($_SESSION["ai_provider_cooldowns"][$k])) {
            $_SESSION["ai_provider_cooldowns"][$k] = $v;
        }
    }
}

function ensureProviderFailureCountSession(): void
{
    if (!isset($_SESSION["ai_provider_fail_counts"]) || !is_array($_SESSION["ai_provider_fail_counts"])) {
        $_SESSION["ai_provider_fail_counts"] = [];
    }

    $defaults = [
        "cerebras" => 0,
        "nvidia" => 0,
        "openrouter" => 0,
        "gemini" => 0,
    ];

    foreach ($defaults as $k => $v) {
        if (!array_key_exists($k, $_SESSION["ai_provider_fail_counts"]) || !is_int($_SESSION["ai_provider_fail_counts"][$k])) {
            $_SESSION["ai_provider_fail_counts"][$k] = $v;
        }
    }
}

function incrementProviderFailureCount(string $name): int
{
    ensureProviderFailureCountSession();
    $current = $_SESSION["ai_provider_fail_counts"][$name] ?? 0;
    $current = is_int($current) ? $current : 0;
    $next = $current + 1;
    $_SESSION["ai_provider_fail_counts"][$name] = $next;
    return $next;
}

function resetProviderFailureCount(string $name): void
{
    ensureProviderFailureCountSession();
    $_SESSION["ai_provider_fail_counts"][$name] = 0;
}

function isProviderCoolingDown(string $name): bool
{
    ensureProviderCooldownSession();
    $now = time();
    $until = $_SESSION["ai_provider_cooldowns"][$name] ?? 0;
    return is_int($until) && $until > 0 && $now < $until;
}

function setProviderCooldown(string $name, int $seconds): void
{
    ensureProviderCooldownSession();
    $now = time();
    $_SESSION["ai_provider_cooldowns"][$name] = $now + max(0, (int)$seconds);
}

function setProviderCooldownWithBackoff(string $name, int $baseSeconds, int $capSeconds): int
{
    $failCount = incrementProviderFailureCount($name); // 1,2,3...
    $multiplier = 1 << max(0, $failCount - 1); // 1,2,4,8...
    $seconds = $baseSeconds * $multiplier;
    $seconds = min($seconds, max(0, (int)$capSeconds));
    setProviderCooldown($name, $seconds);
    return $seconds;
}

// -------------------- AUTH --------------------
if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
    sendJson(["success" => false, "message" => "Unauthorized"], 401);
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendJson(["success" => false, "message" => "Method not allowed"], 405);
}

ensureUserAiKeysTable($pdo);
ensureAiPriorityCacheTable($pdo);

$data = getRequestJson();
$title = trim((string)($data["title"] ?? ""));
$description = trim((string)($data["description"] ?? ""));
$codeReference = trim((string)($data["code"] ?? ""));

if ($title === "" || $description === "") {
    // Still work: keep it safe and never break the form.
    sendJson([
        "success" => true,
        "priority" => "medium",
        "explanation" => "Enter both a title and description so the system can suggest a better priority.",
        "provider" => null,
        "fromCache" => false,
        "fallback" => true,
        "byok" => false,
    ]);
}

// -------------------- Rate limit --------------------
$maxPerMinute = 5;
$count = pruneAndCountRateLimit($maxPerMinute);
if ($count > $maxPerMinute) {
    sendJson([
        "success" => true,
        "priority" => "medium",
        "explanation" => "Too many requests. Please try again shortly.",
        "provider" => null,
        "fromCache" => false,
        "fallback" => true,
        "byok" => false,
    ], 200);
}

// -------------------- Cache --------------------
$normalized = strtolower(trim($title)) . "::" . strtolower(trim($description)) . "::" . strtolower(trim($codeReference));
$cacheKey = hash("sha256", $normalized); // 64 hex chars

try {
    $stmt = $pdo->prepare("SELECT priority, explanation FROM ai_priority_cache WHERE cache_key = ?");
    $stmt->execute([$cacheKey]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && isset($row["priority"]) && isset($row["explanation"])) {
        $priority = strtolower(trim((string)$row["priority"]));
        $explanation = (string)$row["explanation"];
        $validated = validateAndNormalizeResult([
            "priority" => $priority,
            "explanation" => $explanation,
        ]);
        if ($validated) {
            sendJson([
                "success" => true,
                "priority" => $validated["priority"],
                "explanation" => $validated["explanation"],
                "provider" => null,
                "fromCache" => true,
                "fallback" => false,
                "byok" => false,
            ]);
        }
    }
} catch (Throwable $e) {
    // Cache failure should never break AI suggestion; treat as cache miss.
}

// -------------------- AI Provider Chain --------------------
$timeoutMs = 3000;
$prompt = "You are a senior software bug triage assistant.\n"
    . "Use the bug title and description to estimate severity and provide practical debugging guidance.\n\n"
    . "Bug Input:\n"
    . "Title: " . $title . "\n"
    . "Code Reference: " . ($codeReference !== "" ? $codeReference : "(not provided)") . "\n"
    . "Description: " . $description . "\n\n"
    . "Rules:\n"
    . "1) Output EXACTLY valid JSON only.\n"
    . "2) priority must be one of: high, medium, low (lowercase).\n"
    . "3) explanation must be 1-2 sentences about impact/severity only.\n"
    . "4) triage_note must be exactly 3 bullet lines in this format:\n"
    . "   - Look at: <specific file/module/flow>\n"
    . "   - Likely cause: <probable technical cause>\n"
    . "   - First checks: <first debugging checks>\n"
    . "5) Do not repeat the user description verbatim.\n"
    . "6) No markdown code fences and no backticks.\n"
    . "JSON format: {\"priority\":\"high|medium|low\",\"explanation\":\"...\",\"triage_note\":\"...\"}\n"
    . "If triage_note is unavailable, return triage_note as an empty string.";

$keysFile = __DIR__ . "/ai-keys.php";
if (file_exists($keysFile)) {
    require_once $keysFile;
}

$geminiKey = defined("GEMINI_KEY") ? trim((string)GEMINI_KEY) : "";
$openRouterKey = defined("OPENROUTER_KEY") ? trim((string)OPENROUTER_KEY) : "";
$nvidiaKey = defined("NVIDIA_KEY") ? trim((string)NVIDIA_KEY) : "";
$cerebrasKey = defined("CEREBRAS_KEY") ? trim((string)CEREBRAS_KEY) : "";

$aiResult = null;
$provider = null;
$debug = (($_GET["debug"] ?? "") === "1");
$attempts = [];
ensureProviderCooldownSession();
ensureProviderFailureCountSession();
$cooldownCapSeconds = 900; // 15 minutes max backoff

$sessionUserId = (int)$_SESSION["user_id"];
$byokEncryptKey = getByokEncryptKey();

// 0) BYOK — user's own key (never breaks shared chain on failure)
if ($aiResult === null) {
    try {
        if ($byokEncryptKey !== null) {
            $byokStmt = $pdo->prepare("SELECT provider, model, api_key_encrypted, iv FROM user_ai_keys WHERE user_id = ?");
            $byokStmt->execute([$sessionUserId]);
            $byokRow = $byokStmt->fetch(PDO::FETCH_ASSOC);

            if ($byokRow && is_array($byokRow)) {
                $byokProvider = (string)$byokRow["provider"];
                $byokModel = (string)$byokRow["model"];
                $ivBin = @hex2bin((string)$byokRow["iv"]);
                $byokKey = false;
                if ($ivBin !== false && strlen($ivBin) === 16) {
                    $byokKey = openssl_decrypt(
                        (string)$byokRow["api_key_encrypted"],
                        "AES-256-CBC",
                        $byokEncryptKey,
                        0,
                        $ivBin
                    );
                }

                if ($byokKey !== false && is_string($byokKey) && trim($byokKey) !== "") {
                    $byokErr = "";
                    $byokBaseUrls = [
                        "OpenAI" => "https://api.openai.com/v1",
                        "OpenRouter" => "https://openrouter.ai/api/v1",
                        "NVIDIA" => "https://integrate.api.nvidia.com/v1",
                        "Kimi" => "https://api.moonshot.cn/v1",
                        "MiniMax" => "https://api.minimax.chat/v1",
                        "Qwen" => "https://dashscope.aliyuncs.com/compatible-mode/v1",
                        "DeepSeek" => "https://api.deepseek.com/v1",
                        "Mistral" => "https://api.mistral.ai/v1",
                    ];

                    if ($byokProvider === "Google") {
                        $aiResult = callGemini(trim($byokKey), $byokModel, $prompt, $timeoutMs, $byokErr);
                    } elseif ($byokProvider === "Claude") {
                        $aiResult = callClaude(trim($byokKey), $byokModel, $prompt, $timeoutMs, $byokErr);
                    } elseif (isset($byokBaseUrls[$byokProvider])) {
                        $aiResult = callOpenAICompatible($byokBaseUrls[$byokProvider], trim($byokKey), $byokModel, $prompt, $timeoutMs, $byokErr);
                    }

                    if ($aiResult !== null) {
                        $provider = "byok:" . strtolower($byokProvider);
                        if ($debug) {
                            $attempts[] = ["provider" => "byok:" . $byokProvider, "ok" => true, "model" => $byokModel];
                        }
                    } else {
                        if ($debug) {
                            $attempts[] = ["provider" => "byok:" . $byokProvider, "ok" => false, "error" => $byokErr, "model" => $byokModel];
                        }
                    }
                }
            }
        }
    } catch (Throwable $e) {
        if ($debug) {
            $attempts[] = ["provider" => "byok", "ok" => false, "error" => "exception"];
        }
    }
}

// Provider order:
// 1) Cerebras (OpenAI-compatible)
// 2) NVIDIA
// 3) OpenRouter
// 4) Gemini

// 1) Cerebras
if ($aiResult === null) {
    if (isProviderCoolingDown("cerebras")) {
        if ($debug) $attempts[] = ["provider" => "cerebras", "ok" => false, "skipped" => true, "error" => "cooldown_active"];
    } elseif ($cerebrasKey === "") {
        $cd = setProviderCooldownWithBackoff("cerebras", 10, $cooldownCapSeconds);
        if ($debug) $attempts[] = ["provider" => "cerebras", "ok" => false, "error" => "missing_key", "cooldownSeconds" => $cd];
    } else {
        $provider = "cerebras";
        $err = "";
        $aiResult = callOpenAICompatible(
            "https://api.cerebras.ai/v1",
            $cerebrasKey,
            "llama3.1-8b",
            $prompt,
            $timeoutMs,
            $err
        );
        if ($aiResult === null) {
            $cd = setProviderCooldownWithBackoff("cerebras", 10, $cooldownCapSeconds);
            if ($debug) $attempts[] = ["provider" => "cerebras", "ok" => false, "error" => ($err ?: "unknown"), "cooldownSeconds" => $cd];
        } else {
            resetProviderFailureCount("cerebras");
            if ($debug) $attempts[] = ["provider" => "cerebras", "ok" => true, "error" => null];
        }
    }
}

// 2) NVIDIA
if ($aiResult === null) {
    if (isProviderCoolingDown("nvidia")) {
        if ($debug) $attempts[] = ["provider" => "nvidia", "ok" => false, "skipped" => true, "error" => "cooldown_active"];
    } elseif ($nvidiaKey === "") {
        // Missing key counts as failure and sets cooldown
        $cd = setProviderCooldownWithBackoff("nvidia", 10, $cooldownCapSeconds);
        if ($debug) $attempts[] = ["provider" => "nvidia", "ok" => false, "error" => "missing_key", "cooldownSeconds" => $cd];
    } else {
        $provider = "nvidia";
        $err = "";
        $aiResult = callOpenAICompatible(
            "https://integrate.api.nvidia.com/v1",
            $nvidiaKey,
            "moonshotai/kimi-k2-instruct-0905",
            $prompt,
            $timeoutMs,
            $err
        );
        if ($aiResult === null) {
            $cd = setProviderCooldownWithBackoff("nvidia", 10, $cooldownCapSeconds);
            if ($debug) $attempts[] = ["provider" => "nvidia", "ok" => false, "error" => ($err ?: "unknown"), "cooldownSeconds" => $cd];
        } else {
            resetProviderFailureCount("nvidia");
            if ($debug) $attempts[] = ["provider" => "nvidia", "ok" => true, "error" => null];
        }
    }
}

// 3) OpenRouter
if ($aiResult === null) {
    if (isProviderCoolingDown("openrouter")) {
        if ($debug) $attempts[] = ["provider" => "openrouter", "ok" => false, "skipped" => true, "error" => "cooldown_active"];
    } elseif ($openRouterKey === "") {
        $cd = setProviderCooldownWithBackoff("openrouter", 10, $cooldownCapSeconds);
        if ($debug) $attempts[] = ["provider" => "openrouter", "ok" => false, "error" => "missing_key", "cooldownSeconds" => $cd];
    } else {
        $provider = "openrouter";
        $err = "";
        $aiResult = callOpenAICompatible(
            "https://openrouter.ai/api/v1",
            $openRouterKey,
            "openai/gpt-oss-120b:free",
            $prompt,
            $timeoutMs,
            $err
        );
        if ($aiResult === null) {
            $cd = setProviderCooldownWithBackoff("openrouter", 10, $cooldownCapSeconds);
            if ($debug) $attempts[] = ["provider" => "openrouter", "ok" => false, "error" => ($err ?: "unknown"), "cooldownSeconds" => $cd];
        } else {
            resetProviderFailureCount("openrouter");
            if ($debug) $attempts[] = ["provider" => "openrouter", "ok" => true, "error" => null];
        }
    }
}

// 4) Gemini
if ($aiResult === null) {
    if (isProviderCoolingDown("gemini")) {
        if ($debug) $attempts[] = ["provider" => "gemini", "ok" => false, "skipped" => true, "error" => "cooldown_active"];
    } elseif ($geminiKey === "") {
        $cd = setProviderCooldownWithBackoff("gemini", 60, $cooldownCapSeconds);
        if ($debug) $attempts[] = ["provider" => "gemini", "ok" => false, "error" => "missing_key", "cooldownSeconds" => $cd];
    } else {
        $provider = "gemini";
        $err = "";
        $aiResult = callGemini($geminiKey, "gemini-2.5-flash", $prompt, $timeoutMs, $err);
        if ($aiResult === null) {
            $cd = setProviderCooldownWithBackoff("gemini", 60, $cooldownCapSeconds);
            if ($debug) $attempts[] = ["provider" => "gemini", "ok" => false, "error" => ($err ?: "unknown"), "cooldownSeconds" => $cd];
        } else {
            resetProviderFailureCount("gemini");
            if ($debug) $attempts[] = ["provider" => "gemini", "ok" => true, "error" => null];
        }
    }
}

if ($aiResult === null) {
    $payload = [
        "success" => true,
        "priority" => "medium",
        "explanation" => "AI is temporarily unavailable. Defaulting to Medium priority.",
        "provider" => null,
        "fromCache" => false,
        "fallback" => true,
        "byok" => false,
    ];
    if ($debug) $payload["debug"] = ["attempts" => $attempts];
    sendJson($payload);
}

$finalExplanation = $aiResult["explanation"];
$triageText = "";
if (!empty($aiResult["triage_note"]) && is_string($aiResult["triage_note"])) {
    $triageText = trim($aiResult["triage_note"]);
}
if ($triageText === "") {
    $triageText = buildFallbackTriageNote($title, $codeReference);
}
if ($triageText !== "") {
    $finalExplanation .= "\n\nSuggested investigation:\n" . $triageText;
}

// Cache the AI result (best-effort)
try {
    $stmt = $pdo->prepare("
        INSERT INTO ai_priority_cache (cache_key, priority, explanation)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            priority = VALUES(priority),
            explanation = VALUES(explanation),
            created_at = CURRENT_TIMESTAMP
    ");
    $stmt->execute([$cacheKey, $aiResult["priority"], $finalExplanation]);
} catch (Throwable $e) {
    // Cache failure should not affect the response.
}

$byokFlag = is_string($provider) && strncmp($provider, "byok:", 5) === 0;
$payload = [
    "success" => true,
    "priority" => $aiResult["priority"],
    "explanation" => $finalExplanation,
    "provider" => $provider,
    "fromCache" => false,
    "fallback" => false,
    "byok" => $byokFlag,
];
if ($debug) $payload["debug"] = ["attempts" => $attempts];
sendJson($payload);
