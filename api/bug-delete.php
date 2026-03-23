<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/notifications-helpers.php";
require_once __DIR__ . "/admin-helpers.php";
require_once __DIR__ . "/bug-id-helpers.php";
require_once __DIR__ . "/fix-details-helpers.php";

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
    $stmtBug = $pdo->prepare("SELECT id, title, assigned_user_id FROM bugs WHERE id = ?");
    $stmtBug->execute([$id]);
    $bug = $stmtBug->fetch(PDO::FETCH_ASSOC);
    if (!$bug) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Bug not found"]);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM bugs WHERE id = ?");
    $stmt->execute([$id]);
    clearFixDetails($pdo, $id);
    releaseBugNumber($pdo, $id);

    $actorUserId = (int)$_SESSION["user_id"];
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
