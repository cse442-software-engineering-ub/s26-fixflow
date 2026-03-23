<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/admin-helpers.php";
require_once __DIR__ . "/soft-delete-helpers.php";

if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true) ?? [];
$id = isset($data["id"]) ? (int)$data["id"] : 0;

if (!$id) {
    echo json_encode(["success" => false, "message" => "id is required"]);
    exit;
}

try {
    ensureSoftDeleteColumns($pdo);
    if (!softDeleteColumnsAvailable($pdo)) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Soft-delete columns are unavailable on server"]);
        exit;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Soft-delete setup failed on server"]);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE bugs SET deleted_at = NULL, deleted_by_user_id = NULL, deletion_reason = NULL WHERE id = ? AND deleted_at IS NOT NULL");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Deleted bug not found"]);
        exit;
    }

    $actorUserId = (int)$_SESSION["user_id"];
    $actorUsername = (string)($_SESSION["username"] ?? "A teammate");
    logAudit($pdo, $actorUserId, $actorUsername, "bug_restore", "bug", (string)$id, "Restored deleted bug");

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to restore bug"]);
}
