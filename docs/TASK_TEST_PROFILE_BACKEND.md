# Task Test Card — Profile Page Backend

**Task:** Implement a fully functional backend for the user profile page.  
**Target:** Ready for Monday meeting (backend complete and testable).

---

## Scope

- **GET profile:** Return current user’s profile (and optionally assigned bugs) using session.
- **UPDATE profile:** Allow updating full name, email, and username for the logged-in user.
- **Auth:** Profile endpoints require a valid session (login sets `user_id`).

---

## Backend deliverables

| Deliverable | Status | Notes |
|------------|--------|--------|
| `profile_get.php` | ✅ | Uses PDO, returns `user` (id, full_name, email, username) and `assignedBugs`. 401 if not logged in. |
| `profile_update.php` | ✅ | POST/PUT/PATCH; updates full_name, email, username; validates email and unique username. |
| Session on login | ✅ | `login.php` sets `$_SESSION["user_id"]` and `$_SESSION["username"]` after successful login. |

---

## How to test (manual)

1. **Session required**
   - Call `GET profile_get.php` without logging in → expect **401** and `{"error":"Unauthorized"}`.
2. **Get profile**
   - Log in via `login.html` (POST to `login.php`).
   - Open `profile.html` (or call `GET profile_get.php` with same browser/session).  
   - Expect **200** and JSON with `user` (full_name, email, username) and `assignedBugs`.
3. **Update profile**
   - From profile page, change name/email/username and click “Update User Profile”.  
   - Expect POST to `profile_update.php` → **200** and `{"success":true}`.  
   - Reload profile → changes are persisted.
4. **Validation**
   - Update with invalid email → expect **200** with `{"success":false,"message":"Invalid email address"}`.
   - Update username to one already taken by another user → expect `{"success":false,"message":"Username already taken"}`.

---

## Optional (later)

- Add `phone` and `about_me` to `users` table and include in GET/UPDATE:
  - `ALTER TABLE users ADD COLUMN phone VARCHAR(32) DEFAULT NULL, ADD COLUMN about_me TEXT DEFAULT NULL;`
- Then extend `profile_get.php` SELECT and `profile_update.php` UPDATE to use these columns.

---

## Files touched

- `profile_get.php` — fixed to use PDO and session (in project root).
- `profile_update.php` — new; profile update endpoint (in project root).
- `login.php` — session set on successful login.
- `profile.html` — loads profile from API, submits updates to API.
