<?php
session_start();
header("Content-Type: application/json");

require_once(__DIR__ . "/db-connection.php");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$userId = (int)$_SESSION["user_id"];
$data = json_decode(file_get_contents("php://input"), true) ?? [];

$currentPassword = $data["currentPassword"] ?? "";
$newPassword = $data["newPassword"] ?? "";

if (!$currentPassword || !$newPassword) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($currentPassword, $user["password_hash"])) {
        echo json_encode(["success" => false, "message" => "Current password is incorrect"]);
        exit;
    }

    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);

    $updateStmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $updateStmt->execute([$newHash, $userId]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to change password"]);
}

