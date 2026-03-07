<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/admin-helpers.php";
require_once __DIR__ . "/bug-id-helpers.php";

$admin = requireAdmin($pdo);

$userId = isset($_GET["userId"]) ? (int)$_GET["userId"] : 0;

if (!$userId) {
    echo json_encode(["success" => false, "message" => "userId is required"]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            b.id,
            b.title,
            b.status,
            b.priority,
            b.created_at,
            b.due_date
        FROM bugs b
        WHERE b.assigned_user_id = ?
        ORDER BY b.created_at DESC, b.id DESC
    ");
    $stmt->execute([$userId]);
    $bugs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($bugs as &$bug) {
        $bugId = isset($bug["id"]) ? (int)$bug["id"] : 0;
        if ($bugId > 0) {
            $bug["bugNumber"] = formatBugNumber(getOrCreateBugNumber($pdo, $bugId));
        }
    }
    unset($bug);

    logAudit($pdo, (int)$admin["id"], (string)$admin["username"], "admin_view_user_bugs", "user", (string)$userId, "Viewed assigned bugs");
    echo json_encode(["success" => true, "bugs" => $bugs]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to load bugs"]);
}

