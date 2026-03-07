<?php
session_start();
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/admin-helpers.php";

if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
    echo json_encode(["authenticated" => false]);
    exit;
}

echo json_encode([
    "authenticated" => true,
    "user_id" => (int)$_SESSION["user_id"],
    "username" => (string)($_SESSION["username"] ?? ""),
    "role" => getUserRole($pdo, (int)$_SESSION["user_id"], (string)($_SESSION["username"] ?? ""))
]);

