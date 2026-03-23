<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/notifications-helpers.php";
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
$reason = trim((string)($data["reason"] ?? ""));

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
    $stmtBug = $pdo->prepare("SELECT id, title, assigned_user_id, deleted_at FROM bugs WHERE id = ?");
    $stmtBug->execute([$id]);
    $bug = $stmtBug->fetch(PDO::FETCH_ASSOC);
    if (!$bug) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Bug not found"]);
        exit;
    }
    if (!empty($bug["deleted_at"])) {
        echo json_encode(["success" => false, "message" => "Bug is already deleted"]);
        exit;
    }

    $actorUserId = (int)$_SESSION["user_id"];
    $now = date("Y-m-d H:i:s");

    $stmt = $pdo->prepare("UPDATE bugs SET deleted_at = :deleted_at, deleted_by_user_id = :deleted_by, deletion_reason = :reason WHERE id = :id");
    $stmt->execute([
        ":deleted_at" => $now,
        ":deleted_by" => $actorUserId,
        ":reason"     => $reason,
        ":id"         => $id,
    ]);
    $actorUsername = (string)($_SESSION["username"] ?? "A teammate");
    $assignedUserId = isset($bug["assigned_user_id"]) ? (int)$bug["assigned_user_id"] : 0;
    if ($assignedUserId > 0 && $assignedUserId !== $actorUserId) {
        addNotification(
            $pdo,
            $assignedUserId,
            $actorUsername,
            $actorUsername . " deleted bug #" . $id . ": " . ($bug["title"] ?? "Untitled bug"),
            $id
        );
    }
    logAudit(
        $pdo,
        $actorUserId,
        $actorUsername,
        "bug_delete",
        "bug",
        (string)$id,
        "Deleted bug: " . (string)($bug["title"] ?? "")
    );

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to delete bug"]);
}

