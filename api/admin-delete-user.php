<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/admin-helpers.php";

$admin = requireAdmin($pdo);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true) ?? [];

$userId = isset($data["userId"]) ? (int)$data["userId"] : 0;

if (!$userId) {
    echo json_encode(["success" => false, "message" => "userId is required"]);
    exit;
}

try {
    // Optional: prevent deleting yourself via API
    if (isset($_SESSION["user_id"]) && (int)$_SESSION["user_id"] === $userId) {
        echo json_encode(["success" => false, "message" => "You cannot delete your own account"]);
        exit;
    }

    // Load username for audit details before deletion
    $userStmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
    $userStmt->execute([$userId]);
    $targetUser = $userStmt->fetch(PDO::FETCH_ASSOC);

    // Detach bugs assigned to this user
    $clear = $pdo->prepare("UPDATE bugs SET assigned_user_id = NULL WHERE assigned_user_id = ?");
    $clear->execute([$userId]);

    // Delete user
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);

    logAudit(
        $pdo,
        (int)$admin["id"],
        (string)$admin["username"],
        "admin_delete_user",
        "user",
        (string)$userId,
        "Deleted username: " . (string)($targetUser["username"] ?? "")
    );

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to delete user"]);
}

