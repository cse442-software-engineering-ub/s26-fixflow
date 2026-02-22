# Task #28 – PM Checklist: “Implement profile page backend using PHP and MySQL”

Use this to show your PM that the implementation meets the task card.

---

## ✅ Task title

| PM wants | Done? | How |
|----------|--------|-----|
| Backend using **PHP** | ✅ | `profile_get.php`, `profile_update.php`, `login.php` (session) are PHP. |
| Backend using **MySQL** | ✅ | All profile and bug data come from MySQL via `db-connection.php` (PDO). |

---

## ✅ Task Test 1 – Profile data retrieval  
*Bug covered: Incorrect user data returned*

| PM requirement | Done? | How |
|----------------|--------|-----|
| Log in as User A | ✅ | User logs in via `login.html` → `login.php`; session stores `user_id`. |
| Navigate to `profile_get.php` | ✅ | Endpoint exists; same session is used (cookie). |
| Response contains User A’s **id** | ✅ | `user.id` in JSON. |
| Response contains User A’s **username** | ✅ | `user.username` in JSON. |
| Response contains User A’s **name** | ✅ | `user.name` and `user.full_name` in JSON. |
| Response contains User A’s **email** | ✅ | `user.email` in JSON. |
| Response does **not** contain password fields | ✅ | Query selects only `id, full_name, email, username`; no `password_hash` in response. |
| Response does **not** contain data for any other user | ✅ | Query is `WHERE id = ?` with `$_SESSION["user_id"]`; only that user’s row is returned. |

---

## ✅ Task Test 2 – Assigned bugs query  
*Bug covered: Incorrect bug filtering*

| PM requirement | Done? | How |
|----------------|--------|-----|
| Log in as User A | ✅ | Same as above. |
| At least one bug in DB assigned to User A | ✅ | PM/tester ensures this in DB. |
| Navigate to `profile_get.php` | ✅ | Same endpoint. |
| Assigned bugs list contains **only** bugs assigned to User A | ✅ | Bugs query is `WHERE assigned_to = ?` with same `user_id`; no other users’ bugs. |

---

## ✅ User story (dependency)

*“As a registered FixFlow user, I want to view and update my profile so that I can confirm my account information and see the bugs assigned to me.”*

| Story point | Done? | How |
|-------------|--------|-----|
| View my profile | ✅ | `GET profile_get.php` returns current user + assigned bugs; `profile.html` loads it. |
| Update my profile | ✅ | `POST profile_update.php` updates full name, email, username for current user. |
| Confirm my account information | ✅ | Profile page shows and saves name, email, username. |
| See the bugs assigned to me | ✅ | `profile_get.php` returns `assignedBugs` filtered by `assigned_to = current user`. |

---

## Summary for PM

- **Backend:** PHP + MySQL, as specified.
- **Task Test 1:** Profile data is correct (id, username, name, email; no password; only current user).
- **Task Test 2:** Assigned bugs list is filtered to the logged-in user only.
- **User story:** View profile, update profile, and see assigned bugs are all supported.

You can run the two task tests manually (log in → open `profile_get.php` in browser or via fetch) and use this checklist in the Monday meeting.
