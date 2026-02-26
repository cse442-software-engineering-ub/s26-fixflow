<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/db-connection.php";

/* AUTH CHECK (same as bugs-list.php) */
if (!isset($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

/* Optional filters (match your overdue.html dropdowns) */
$status   = $_GET["status"] ?? "";     // "Open", "In Progress", etc
$priority = $_GET["priority"] ?? "";   // "Low", "Medium", "High", "Critical"
$assigned = $_GET["assigned"] ?? "";   // "Anyone" or username or user id depending on your UI
$sort     = $_GET["sort"] ?? "most_overdue"; // "most_overdue" or "least_overdue"

/* Build SQL */
$sql = "
    SELECT 
        b.id,
        b.title,
        b.status,
        b.priority,
        b.due_date,
        u.username AS assigned_to
    FROM overduebugs b
    LEFT JOIN users u ON b.assigned_user_id = u.id
    WHERE b.due_date < CURDATE()
      AND b.status NOT IN ('Resolved', 'Closed')
";

$params = [];

/* Filters */
if ($status !== "" && $status !== "All") {
    $sql .= " AND b.status = :status ";
    $params[":status"] = $status;
}

if ($priority !== "" && $priority !== "All") {
    $sql .= " AND b.priority = :priority ";
    $params[":priority"] = $priority;
}

/*
  Assigned filter options depend on how your frontend sends it.
  Common options:
   - "Anyone" -> no filter
   - username -> filter by u.username
*/
if ($assigned !== "" && $assigned !== "Anyone" && $assigned !== "All") {
    $sql .= " AND u.username = :assigned ";
    $params[":assigned"] = $assigned;
}

/* Sorting */
if ($sort === "least_overdue") {
    $sql .= " ORDER BY b.due_date DESC ";
} else {
    // most_overdue (default): oldest due date first
    $sql .= " ORDER BY b.due_date ASC ";
}

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $bugs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "count" => count($bugs),
        "bugs" => $bugs
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Query failed"
        // Debug if you want temporarily:
        // "debug" => $e->getMessage()
    ]);
}