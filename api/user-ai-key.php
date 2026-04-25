<?php
/**
 * BYOK — user AI API key storage (encrypted at rest).
 * GET / POST / DELETE — session auth required.
 */
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";

$keysFile = __DIR__ . "/ai-keys.php";
if (file_exists($keysFile)) {
    require_once $keysFile;
}

/**
 * Ensure BYOK storage exists for teammates whose local/shared DB was not
 * manually provisioned through phpMyAdmin yet.
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
 * BYOK uses one app-level encryption secret to protect each user's provider
 * key before storing it in the database. The user never supplies this value.
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
    if ($raw === false || $raw === "") {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** Match frontend user-ai-key-mock.ts maskApiKey() */
function maskApiKey(string $key): string
{
    $t = trim($key);
    if (strlen($t) <= 8) {
        return "••••••••";
    }
    $tail = substr($t, -4);
    $dots = str_repeat("•", min(24, strlen($t)));
    return $dots . $tail;
}

/** Allowed provider + model — must match frontend AI_MODELS_BY_PROVIDER */
$providerModels = [
    "Google" => [
        "gemini-3.1-pro-preview",
        "gemini-3-flash-preview",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash-native-audio-preview-09-2025",
    ],
    "Claude" => [
        "claude-opus-4.6",
        "claude-sonnet-4.6",
        "claude-haiku-4.5",
        "claude-opus-4.5",
        "claude-sonnet-4.5",
    ],
    "OpenAI" => ["gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-4o", "o4-mini"],
    "OpenRouter" => [
        "google/gemini-3-flash-preview:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen3-coder:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "arcee-ai/trinity-large-preview:free",
    ],
    "NVIDIA" => [
        "nvidia/nemotron-3-super-120b-a12b",
        "nvidia/nemotron-3-nano-30b-a3b",
        "nvidia/nemotron-3-super",
        "nvidia/nemotron-mini",
        "nvidia/nemotron-4",
    ],
    "Kimi" => ["Kimi K2.5", "Kimi K1.6", "Kimi K1.5", "Kimi K1"],
    "MiniMax" => ["MiniMax M2.7", "MiniMax M2.5", "MiniMax M2.1", "MiniMax M2"],
    "Qwen" => [
        "Qwen 3.6 Plus",
        "Qwen 3.5 Omni",
        "Qwen3-Coder-480B-A35B-Instruct",
        "Qwen3-235B-A22B",
        "Qwen 3.5 9B",
    ],
    "DeepSeek" => [
        "DeepSeek-V3.2",
        "DeepSeek R1",
        "DeepSeek V4",
        "DeepSeek Coder",
        "DeepSeek Math",
    ],
    "Mistral" => ["mistral-large-3", "mistral-small-4", "mistral-3", "pixtral", "devstral"],
];

function isValidProviderModel(string $provider, string $model, array $providerModels): bool
{
    if (!isset($providerModels[$provider])) {
        return false;
    }
    foreach ($providerModels[$provider] as $allowed) {
        if ($allowed === $model) {
            return true;
        }
    }
    return false;
}

// -------------------- AUTH --------------------
if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
    sendJson(["success" => false, "message" => "Unauthorized"], 401);
}

$userId = (int)$_SESSION["user_id"];
$method = $_SERVER["REQUEST_METHOD"] ?? "GET";
ensureUserAiKeysTable($pdo);

// -------------------- GET --------------------
if ($method === "GET") {
    try {
        $stmt = $pdo->prepare("SELECT provider, model, api_key_encrypted, iv FROM user_ai_keys WHERE user_id = ?");
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            sendJson([
                "success" => true,
                "hasKey" => false,
                "provider" => null,
                "model" => null,
                "maskedKey" => null,
            ]);
        }
        $encryptKey = getByokEncryptKey();
        if ($encryptKey === null) {
            sendJson([
                "success" => true,
                "hasKey" => true,
                "provider" => (string)$row["provider"],
                "model" => (string)$row["model"],
                "maskedKey" => "••••••••",
            ]);
        }
        $plain = openssl_decrypt(
            (string)$row["api_key_encrypted"],
            "AES-256-CBC",
            $encryptKey,
            0,
            hex2bin((string)$row["iv"])
        );
        if ($plain === false) {
            sendJson([
                "success" => true,
                "hasKey" => true,
                "provider" => (string)$row["provider"],
                "model" => (string)$row["model"],
                "maskedKey" => "••••••••",
            ]);
        }
        sendJson([
            "success" => true,
            "hasKey" => true,
            "provider" => (string)$row["provider"],
            "model" => (string)$row["model"],
            "maskedKey" => maskApiKey($plain),
        ]);
    } catch (Throwable $e) {
        sendJson(["success" => false, "message" => "Server error"], 500);
    }
}

// -------------------- POST --------------------
if ($method === "POST") {
    $encryptKey = getByokEncryptKey();
    if ($encryptKey === null) {
        sendJson(["success" => false, "message" => "BYOK encryption not configured"], 503);
    }
    $data = getRequestJson();
    $provider = isset($data["provider"]) ? trim((string)$data["provider"]) : "";
    $model = isset($data["model"]) ? trim((string)$data["model"]) : "";
    $apiKey = isset($data["api_key"]) ? trim((string)$data["api_key"]) : "";

    if (!isset($providerModels[$provider])) {
        sendJson(["success" => false, "message" => "Invalid provider"], 400);
    }
    if (!isValidProviderModel($provider, $model, $providerModels)) {
        sendJson(["success" => false, "message" => "Invalid model for provider"], 400);
    }
    if ($apiKey === "" || strlen($apiKey) > 500) {
        sendJson(["success" => false, "message" => "Invalid API key"], 400);
    }

    $ivBin = random_bytes(16);
    $ivHex = bin2hex($ivBin);
    $encrypted = openssl_encrypt($apiKey, "AES-256-CBC", $encryptKey, 0, $ivBin);
    if ($encrypted === false) {
        sendJson(["success" => false, "message" => "Encryption failed"], 500);
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO user_ai_keys (user_id, provider, model, api_key_encrypted, iv)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                provider = VALUES(provider),
                model = VALUES(model),
                api_key_encrypted = VALUES(api_key_encrypted),
                iv = VALUES(iv),
                updated_at = CURRENT_TIMESTAMP
        ");
        $stmt->execute([$userId, $provider, $model, $encrypted, $ivHex]);
        sendJson(["success" => true]);
    } catch (Throwable $e) {
        sendJson(["success" => false, "message" => "Could not save"], 500);
    }
}

// -------------------- DELETE --------------------
if ($method === "DELETE") {
    try {
        $stmt = $pdo->prepare("DELETE FROM user_ai_keys WHERE user_id = ?");
        $stmt->execute([$userId]);
        sendJson(["success" => true]);
    } catch (Throwable $e) {
        sendJson(["success" => false, "message" => "Could not remove"], 500);
    }
}

sendJson(["success" => false, "message" => "Method not allowed"], 405);
