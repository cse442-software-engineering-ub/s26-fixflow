<?php

/**
 * Ensures the bugs table has soft-delete columns.
 * Safe to call multiple times (ignores "column already exists" errors).
 */
function ensureSoftDeleteColumns(PDO $pdo): void
{
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    $columns = ['deleted_at', 'deleted_by_user_id', 'deletion_reason'];

    foreach ($columns as $col) {
        try {
            if ($driver === 'sqlite') {
                $colType = $col === 'deleted_by_user_id' ? 'INTEGER' : 'TEXT';
                $pdo->exec("ALTER TABLE bugs ADD COLUMN $col $colType");
            } else {
                $colType = $col === 'deleted_at' ? 'DATETIME NULL' : ($col === 'deleted_by_user_id' ? 'INT NULL' : 'TEXT NULL');
                $pdo->exec("ALTER TABLE bugs ADD COLUMN $col $colType");
            }
        } catch (PDOException $e) {
            $msg = $e->getMessage();
            if (stripos($msg, 'duplicate') !== false || stripos($msg, 'already exists') !== false) {
                continue;
            }
            throw $e;
        }
    }
}

/**
 * Checks whether all soft-delete columns are present on bugs.
 */
function softDeleteColumnsAvailable(PDO $pdo): bool
{
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    $required = ['deleted_at', 'deleted_by_user_id', 'deletion_reason'];
    $existing = [];

    if ($driver === 'sqlite') {
        $rows = $pdo->query("PRAGMA table_info(bugs)")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            if (isset($row['name'])) $existing[] = (string)$row['name'];
        }
    } else {
        $stmt = $pdo->query("SHOW COLUMNS FROM bugs");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            if (isset($row['Field'])) $existing[] = (string)$row['Field'];
        }
    }

    foreach ($required as $col) {
        if (!in_array($col, $existing, true)) return false;
    }
    return true;
}
