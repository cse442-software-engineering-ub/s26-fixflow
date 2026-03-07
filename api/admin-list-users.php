<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/admin-helpers.php";

$admin = requireAdmin($pdo);
ensureUsersLastLoginColumn($pdo);

try {
    $stmt = $pdo->query("
        SELECT 
            u.id,
            u.full_name,
            u.email,
            u.username,
            u.created_at,
            u.last_login_at,
            COALESCE(ur.role, CASE WHEN u.username = 'mlabibah' THEN 'admin' ELSE 'developer' END) AS role,
            (SELECT COUNT(*) FROM bugs b WHERE b.assigned_user_id = u.id) AS assigned_count
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        ORDER BY u.created_at DESC, u.id DESC
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    logAudit($pdo, (int)$admin["id"], (string)$admin["username"], "admin_list_users", "user", null, "Viewed users list");
    echo json_encode(["success" => true, "users" => $users]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to list users"]);
}

