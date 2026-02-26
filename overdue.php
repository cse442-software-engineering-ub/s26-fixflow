<?php
header("Content-Type: application/json");

ob_start();
require_once(__DIR__ . "/db-connection.php");
ob_end_clean();

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$today = date("Y-m-d");

$stmt = $pdo->prepare(
    "SELECT
        b.id,
        b.title,
        b.status,
        b.priority,
        b.due_date,
        u.username AS assigned_to
     FROM overduebugs b
     LEFT JOIN users u ON b.assigned_user_id = u.id
     WHERE b.due_date < :today
       AND b.status NOT IN ('Resolved', 'Closed')
     ORDER BY b.due_date ASC"
);
$stmt->execute([":today" => $today]);

$bugs = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "success" => true,
    "bugs"    => $bugs
]);