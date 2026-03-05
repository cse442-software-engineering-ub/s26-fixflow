<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

/**
 * AUTH CHECK
 * Adjust this to match how your project stores login state.
 */
if (!isset($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(["error" => "Unauthorized"]);
  exit;
}

require_once "db-connection.php"; // must define $conn (mysqli)

/**
 * OPTIONAL query params:
 *  - status=Open|In progress|Resolved
 *  - sort=newest|oldest
 */
$status = isset($_GET["status"]) ? trim($_GET["status"]) : null;
$sort   = isset($_GET["sort"]) ? trim($_GET["sort"]) : "newest";

/**
 * Validate allowed inputs (prevents SQL injection via params)
 */
$allowedStatus = ["Open", "In progress", "Resolved"];
if ($status !== null && $status !== "" && !in_array($status, $allowedStatus, true)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid status"]);
  exit;
}

$sort = ($sort === "oldest") ? "oldest" : "newest";
$orderBy = ($sort === "oldest") ? "ASC" : "DESC";

/**
 * TODO: UPDATE THESE TABLE/COLUMN NAMES TO MATCH YOUR DB:
 * Assumed:
 *   bugs table columns: bug_id, title, status, priority, created_at, assigned_user_id
 *   users table columns: user_id, username
 */
$sql = "
  SELECT
    b.bug_id AS id,
    b.title AS title,
    b.status AS status,
    b.priority AS priority,
    u.username AS assigned,
    b.created_at AS createdAt
  FROM bugs b
  LEFT JOIN users u ON b.assigned_user_id = u.user_id
";

/**
 * Add status filter if provided
 */
$params = [];
$types = "";

if ($status !== null && $status !== "") {
  $sql .= " WHERE b.status = ? ";
  $params[] = $status;
  $types .= "s";
}

/**
 * Sorting rule:
 * - Prefer created_at if it exists
 * - If you don't have created_at, switch this to b.bug_id
 */
$sql .= " ORDER BY b.created_at $orderBy, b.bug_id $orderBy ";

/**
 * Prepare + execute
 */
$stmt = mysqli_prepare($conn, $sql);
if (!$stmt) {
  http_response_code(500);
  echo json_encode(["error" => "Failed to prepare SQL"]);
  exit;
}

if (!empty($params)) {
  mysqli_stmt_bind_param($stmt, $types, ...$params);
}

if (!mysqli_stmt_execute($stmt)) {
  http_response_code(500);
  echo json_encode(["error" => "Failed to execute SQL"]);
  exit;
}

$result = mysqli_stmt_get_result($stmt);
if (!$result) {
  http_response_code(500);
  echo json_encode(["error" => "Failed to fetch SQL result"]);
  exit;
}

$bugs = [];
while ($row = mysqli_fetch_assoc($result)) {
  $bugs[] = [
    "id"        => (int)$row["id"],
    "title"     => $row["title"],
    "status"    => $row["status"],
    "priority"  => $row["priority"],
    "assigned"  => $row["assigned"] ? $row["assigned"] : null,
    "createdAt" => $row["createdAt"]
  ];
}

echo json_encode($bugs);
