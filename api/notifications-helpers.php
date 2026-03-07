<?php

function ensureNotificationsTable(PDO $pdo): void
{
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

    if ($driver === "sqlite") {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient_user_id INTEGER NOT NULL,
                actor_username TEXT NOT NULL,
                message TEXT NOT NULL,
                bug_id INTEGER NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                is_read INTEGER NOT NULL DEFAULT 0
            );
        ");
    } else {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                recipient_user_id INT NOT NULL,
                actor_username VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                bug_id INT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                is_read TINYINT(1) NOT NULL DEFAULT 0,
                INDEX idx_notifications_recipient_created (recipient_user_id, created_at)
            );
        ");
    }
}

function addNotification(
    PDO $pdo,
    int $recipientUserId,
    string $actorUsername,
    string $message,
    ?int $bugId = null
): void {
    if ($recipientUserId <= 0 || trim($message) === "") {
        return;
    }

    ensureNotificationsTable($pdo);

    $stmt = $pdo->prepare("
        INSERT INTO notifications (recipient_user_id, actor_username, message, bug_id)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$recipientUserId, $actorUsername, $message, $bugId]);
}
