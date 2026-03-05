<?php

function fixDetailsStorePath(): string
{
    $fromEnv = getenv("FIXFLOW_FIX_DETAILS_FILE");
    if (is_string($fromEnv) && trim($fromEnv) !== "") {
        return $fromEnv;
    }
    $tmpDir = sys_get_temp_dir();
    return rtrim($tmpDir, "/") . "/fixflow-fix-details.json";
}

function readFixDetailsStore(): array
{
    $path = fixDetailsStorePath();
    if (!file_exists($path)) {
        return [];
    }
    $raw = @file_get_contents($path);
    if ($raw === false || $raw === "") {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function writeFixDetailsStore(array $store): void
{
    $path = fixDetailsStorePath();
    $json = json_encode($store);
    if ($json === false) {
        return;
    }
    file_put_contents($path, $json, LOCK_EX);
}

function upsertFixDetails(PDO $pdo, int $bugId, array $fixDetails): void
{
    $description = trim((string)($fixDetails["description"] ?? ""));
    $fixedBy = trim((string)($fixDetails["fixedBy"] ?? ""));
    $fixedAt = trim((string)($fixDetails["fixedAt"] ?? ""));
    if ($description === "" || $fixedBy === "" || $fixedAt === "") {
        return;
    }
    $store = readFixDetailsStore();
    $store[(string)$bugId] = $fixDetails;
    writeFixDetailsStore($store);
}

function clearFixDetails(PDO $pdo, int $bugId): void
{
    $store = readFixDetailsStore();
    unset($store[(string)$bugId]);
    writeFixDetailsStore($store);
}

function getFixDetailsForBug(PDO $pdo, int $bugId): ?array
{
    $store = readFixDetailsStore();
    $value = $store[(string)$bugId] ?? null;
    return is_array($value) ? $value : null;
}
