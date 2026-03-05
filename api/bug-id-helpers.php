<?php

function ensureBugIdTable(PDO $pdo): void
{
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

    if ($driver === "sqlite") {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS bug_id_map (
                bug_id INTEGER PRIMARY KEY,
                bug_number INTEGER NOT NULL UNIQUE
            );
        ");
    } else {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS bug_id_map (
                bug_id INT PRIMARY KEY,
                bug_number INT NOT NULL UNIQUE
            );
        ");
    }
}

function nextAvailableBugNumber(PDO $pdo): int
{
    $stmt = $pdo->query("SELECT bug_number FROM bug_id_map ORDER BY bug_number ASC");
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $expected = 1;
    foreach ($rows as $value) {
        $current = (int)$value;
        if ($current < $expected) {
            continue;
        }
        if ($current > $expected) {
            break;
        }
        $expected++;
    }
    return $expected;
}

function getOrCreateBugNumber(PDO $pdo, int $bugId): int
{
    ensureBugIdTable($pdo);

    $select = $pdo->prepare("SELECT bug_number FROM bug_id_map WHERE bug_id = ?");
    $select->execute([$bugId]);
    $existing = $select->fetch(PDO::FETCH_ASSOC);
    if ($existing && isset($existing["bug_number"])) {
        return (int)$existing["bug_number"];
    }

    $next = nextAvailableBugNumber($pdo);
    $insert = $pdo->prepare("INSERT INTO bug_id_map (bug_id, bug_number) VALUES (?, ?)");
    $insert->execute([$bugId, $next]);
    return $next;
}

function releaseBugNumber(PDO $pdo, int $bugId): void
{
    ensureBugIdTable($pdo);
    $delete = $pdo->prepare("DELETE FROM bug_id_map WHERE bug_id = ?");
    $delete->execute([$bugId]);
}

function formatBugNumber(int $num): string
{
    return "Bug-" . $num;
}
