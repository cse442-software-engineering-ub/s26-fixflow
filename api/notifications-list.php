<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/notifications-helpers.php";

if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$userId = (int)$_SESSION["user_id"];
$limit = isset($_GET["limit"]) ? (int)$_GET["limit"] : 20;
if ($limit <= 0) $limit = 20;
if ($limit > 100) $limit = 100;

try {
    ensureNotificationsTable($pdo);

    // Use a bound parameter for LIMIT where supported.
    $stmt = $pdo->prepare("
        SELECT id, recipient_user_id, actor_username, message, bug_id, created_at, is_read
        FROM notifications
        WHERE recipient_user_id = :user_id
        ORDER BY id DESC
        LIMIT :limit_rows
    ");
    $stmt->bindValue(":user_id", $userId, PDO::PARAM_INT);
    $stmt->bindValue(":limit_rows", $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $activities = array_map(function ($row) {
        return [
            "id" => "notif-" . (string)$row["id"],
            "type" => "notification",
            "bugNumber" => isset($row["bug_id"]) && $row["bug_id"] !== null ? "#" . (string)$row["bug_id"] : "",
            "bugTitle" => "",
            "message" => (string)$row["message"],
            "timestamp" => (string)$row["created_at"],
            "user" => "",
            "isRead" => (int)($row["is_read"] ?? 0) === 1,
        ];
    }, $rows);

    echo json_encode(["success" => true, "activities" => $activities]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to load notifications"]);
}
