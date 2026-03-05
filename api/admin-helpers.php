<?php

function ensureRoleAndAuditTables(PDO $pdo): void
{
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

    if ($driver === "sqlite") {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS user_roles (
                user_id INTEGER PRIMARY KEY,
                role TEXT NOT NULL
            );
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                actor_user_id INTEGER NULL,
                actor_username TEXT NOT NULL,
                action TEXT NOT NULL,
                target_type TEXT NOT NULL,
                target_id TEXT NULL,
                details TEXT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        ");
    } else {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS user_roles (
                user_id INT PRIMARY KEY,
                role VARCHAR(32) NOT NULL
            );
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                actor_user_id INT NULL,
                actor_username VARCHAR(255) NOT NULL,
                action VARCHAR(255) NOT NULL,
                target_type VARCHAR(255) NOT NULL,
                target_id VARCHAR(255) NULL,
                details TEXT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_audit_logs_created (created_at)
            );
        ");
    }
}

function ensureUsersLastLoginColumn(PDO $pdo): void
{
    // Attempt to add the column. If it already exists, ignore the error.
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    try {
        if ($driver === "sqlite") {
            $pdo->exec("ALTER TABLE users ADD COLUMN last_login_at TEXT NULL");
        } else {
            $pdo->exec("ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL");
        }
    } catch (PDOException $e) {
        // no-op: most likely "duplicate column"
    }
}

function getUserRole(PDO $pdo, int $userId, string $username): string
{
    ensureRoleAndAuditTables($pdo);
    $legacyAdmins = ["mlabibah"];

    $stmt = $pdo->prepare("SELECT role FROM user_roles WHERE user_id = ?");
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && isset($row["role"])) {
        return (string)$row["role"];
    }

    // Backward compatibility: existing hardcoded admin stays admin.
    if (in_array($username, $legacyAdmins, true)) {
        $insert = $pdo->prepare("INSERT INTO user_roles (user_id, role) VALUES (?, ?)");
        $insert->execute([$userId, "admin"]);
        return "admin";
    }

    return "developer";
}

function setUserRole(PDO $pdo, int $userId, string $role): void
{
    ensureRoleAndAuditTables($pdo);
    $safeRole = in_array($role, ["admin", "developer"], true) ? $role : "developer";

    $update = $pdo->prepare("UPDATE user_roles SET role = ? WHERE user_id = ?");
    $update->execute([$safeRole, $userId]);
    if ($update->rowCount() === 0) {
        $insert = $pdo->prepare("INSERT INTO user_roles (user_id, role) VALUES (?, ?)");
        $insert->execute([$userId, $safeRole]);
    }
}

function requireAdmin(PDO $pdo): array
{
    if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized"]);
        exit;
    }

    $userId = (int)$_SESSION["user_id"];
    $username = (string)($_SESSION["username"] ?? "");
    $role = getUserRole($pdo, $userId, $username);

    if ($role !== "admin") {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden"]);
        exit;
    }

    return ["id" => $userId, "username" => $username, "role" => $role];
}

function logAudit(
    PDO $pdo,
    ?int $actorUserId,
    string $actorUsername,
    string $action,
    string $targetType,
    ?string $targetId = null,
    ?string $details = null
): void {
    ensureRoleAndAuditTables($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO audit_logs (actor_user_id, actor_username, action, target_type, target_id, details)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$actorUserId, $actorUsername, $action, $targetType, $targetId, $details]);
}
