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
$username = isset($data["username"]) ? trim((string)$data["username"]) : "";
$newPassword = $data["newPassword"] ?? "";

if ((!$userId && !$username) || !$newPassword) {
    echo json_encode(["success" => false, "message" => "userId/username and newPassword are required"]);
    exit;
}

try {
    if ($userId) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
    }

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit;
    }

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);

    $update = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $update->execute([$hash, (int)$user["id"]]);

    logAudit(
        $pdo,
        (int)$admin["id"],
        (string)$admin["username"],
        "admin_reset_password",
        "user",
        (string)((int)$user["id"]),
        "Password reset by admin"
    );

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to reset password"]);
}

