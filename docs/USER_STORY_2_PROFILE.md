# User Story #2 — User Profile Page

**Story ID:** 2  
**Feature:** User profile view and edit

---

## User story (reusable card)

**As a** logged-in user  
**I want to** view and update my profile (name, email, username)  
**So that** my account information is correct and I can manage my identity in FixFlow.

---

## Acceptance criteria

- I can open the profile page when I am logged in.
- I see my current full name, email, and username pre-filled.
- I can change my display name (full name), email, and username and save.
- If I am not logged in, I am redirected to the login page.
- After saving, I see a success message and my changes are persisted.

---

## Notes

- This story is tied to the **Task: Profile page backend** (GET profile, UPDATE profile, session-based auth).
- Optional fields (e.g. phone, about me) can be added in a later iteration once the `users` table is extended.
