<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/bug-id-helpers.php";
require_once __DIR__ . "/fix-details-helpers.php";
require_once __DIR__ . "/soft-delete-helpers.php";

if (!isset($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$softDeleteReady = true;
try {
    ensureSoftDeleteColumns($pdo);
    $softDeleteReady = softDeleteColumnsAvailable($pdo);
} catch (PDOException $e) {
    $softDeleteReady = false;
}

if (!$softDeleteReady) {
    echo json_encode(["success" => true, "bugs" => []]);
    exit;
}

$sort = $_GET["sort"] ?? "newest";
$order = ($sort === "oldest") ? "ASC" : "DESC";

$sql = "
    SELECT 
        b.id,
        b.title,
        b.status,
        b.priority,
        b.created_at,
        b.due_date,
        b.deleted_at,
        b.deleted_by_user_id,
        b.deletion_reason,
        u.username AS assignedTo,
        du.username AS deletedBy,
        b.code,
        b.description
    FROM bugs b
    LEFT JOIN users u ON b.assigned_user_id = u.id
    LEFT JOIN users du ON b.deleted_by_user_id = du.id
    WHERE b.deleted_at IS NOT NULL
    ORDER BY b.deleted_at $order
";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $bugs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($bugs as &$bug) {
        $bugId = isset($bug["id"]) ? (int)$bug["id"] : 0;
        if ($bugId > 0) {
            $bug["bugNumber"] = formatBugNumber(getOrCreateBugNumber($pdo, $bugId));
        }
        $fixDetails = getFixDetailsForBug($pdo, $bugId);
        if ($fixDetails !== null) {
            $bug["fixDetails"] = $fixDetails;
            if (isset($fixDetails["fixedAt"])) {
                $bug["fixedAt"] = $fixDetails["fixedAt"];
            }
        }
    }
    unset($bug);

    echo json_encode(["success" => true, "bugs" => $bugs]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Query failed"]);
}
