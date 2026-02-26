<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/db-connection.php";

/* AUTH CHECK */
if (!isset($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

/* Optional filters */
$status = $_GET["status"] ?? "";
$sort   = $_GET["sort"] ?? "newest";

$allowedStatus = ["Open", "In progress", "Resolved"];
if ($status !== "" && !in_array($status, $allowedStatus, true)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid status"]);
    exit;
}

$order = ($sort === "oldest") ? "ASC" : "DESC";

/* MATCHES YOUR REAL TABLE STRUCTURE */
$sql = "
    SELECT 
        b.id,
        b.title,
        b.status,
        b.priority,
        b.created_at,
        u.username AS assigned
    FROM bugs b
    LEFT JOIN users u ON b.assigned_user_id = u.id
";

$params = [];

if ($status !== "") {
    $sql .= " WHERE b.status = :status ";
    $params["status"] = $status;
}

$sql .= " ORDER BY b.id $order ";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $bugs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($bugs);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Query failed"]);
}