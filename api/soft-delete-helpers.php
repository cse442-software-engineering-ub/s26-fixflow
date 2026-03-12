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
