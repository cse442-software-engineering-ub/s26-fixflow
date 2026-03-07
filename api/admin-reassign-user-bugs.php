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

$fromUserId = isset($data["fromUserId"]) ? (int)$data["fromUserId"] : 0;
$toUserId = array_key_exists("toUserId", $data) && $data["toUserId"] !== null ? (int)$data["toUserId"] : null;

if (!$fromUserId) {
    echo json_encode(["success" => false, "message" => "fromUserId is required"]);
    exit;
}

try {
    if ($toUserId !== null) {
        // Ensure target user exists
        $check = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $check->execute([$toUserId]);
        if (!$check->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode(["success" => false, "message" => "Target user not found"]);
            exit;
        }
    }

    if ($toUserId === null) {
        $stmt = $pdo->prepare("UPDATE bugs SET assigned_user_id = NULL WHERE assigned_user_id = ?");
        $stmt->execute([$fromUserId]);
    } else {
        $stmt = $pdo->prepare("UPDATE bugs SET assigned_user_id = ? WHERE assigned_user_id = ?");
        $stmt->execute([$toUserId, $fromUserId]);
    }

    logAudit(
        $pdo,
        (int)$admin["id"],
        (string)$admin["username"],
        "admin_reassign_user_bugs",
        "user",
        (string)$fromUserId,
        json_encode(["fromUserId" => $fromUserId, "toUserId" => $toUserId])
    );

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to reassign bugs"]);
}

