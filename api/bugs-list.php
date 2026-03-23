<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/bug-id-helpers.php";
require_once __DIR__ . "/fix-details-helpers.php";

/* AUTH CHECK */
if (!isset($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

/* Optional filters */
$status = $_GET["status"] ?? "";
$sort   = $_GET["sort"] ?? "newest";

$order = ($sort === "oldest") ? "ASC" : "DESC";

// Optional: filter by assigned username or "me"
$assignedTo = $_GET["assignedTo"] ?? "";
$currentUserId = (int)$_SESSION["user_id"];

$sql = "
    SELECT 
        b.id,
        b.title,
        b.status,
        b.priority,
        b.created_at,
        b.due_date,
        u.username AS assignedTo,
        b.code,
        b.description
    FROM bugs b
    LEFT JOIN users u ON b.assigned_user_id = u.id
";

$clauses = [];
$params = [];

if ($status !== "") {
    $clauses[] = "b.status = :status";
    $params[":status"] = $status;
}

if ($assignedTo !== "") {
    if ($assignedTo === "me") {
        $clauses[] = "b.assigned_user_id = :meId";
        $params[":meId"] = $currentUserId;
    } else {
        $clauses[] = "u.username = :assignedTo";
        $params[":assignedTo"] = $assignedTo;
    }
}

if ($clauses) {
    $sql .= " WHERE " . implode(" AND ", $clauses);
}

$sql .= " ORDER BY b.id $order ";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
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