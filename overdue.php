<?php
header("Content-Type: application/json");

require "db-connection.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

try {
    $today = date("Y-m-d");

    $stmt = $pdo->prepare(
        "SELECT
            b.id,
            b.title,
            b.status,
            b.priority,
            b.due_date,
            u.username AS assigned_to
         FROM bugs b
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

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch overdue bugs"
    ]);
}
