# Git pull & push walkthrough (profile backend branch)

You're on branch **28-profile-page-backend**.  
**Rule: Pull from `dev` only. Push only your branch — never push to `main`.**

---

## Step 1: Get the latest from GitHub (pull from dev)

Open Terminal in your project folder (or use Cursor's terminal).

**Keep your branch up to date with `dev` (not main):**
```bash
git fetch origin
git merge origin/dev
```
If there are conflicts, Git will tell you; fix them, then `git add` the fixed files and `git commit`.

**If your branch already exists on GitHub and you want to update it:**
```bash
git pull origin 28-profile-page-backend
```
If the branch doesn't exist on GitHub yet, that's fine — skip to Step 2.

---

## Step 2: Stage your files (add)

Stage the profile backend files (leave out `.DS_Store`):
```bash
git add profile_get.php profile_update.php login.php profile.html docs/
```

Check what's staged:
```bash
git status
```
You should see "Changes to be committed" with those files.

---

## Step 3: Commit (save a snapshot)

```bash
git commit -m "Implement profile page backend: profile_get (PDO), profile_update, session on login, wire profile.html, add docs"
```

---

## Step 4: Push only your branch (never push to main)

**Push only to your branch:**
```bash
git push -u origin 28-profile-page-backend
```

Next times:
```bash
git push
```

**Do not run:** `git push origin main` or `git push origin dev` unless you intend to update those branches. Your work stays on **28-profile-page-backend** only.

---

## Quick reference (all in one)

```bash
cd /Users/labibahsan/Desktop/Fixflow/s26-fixflow

# 1. Pull latest from dev (not main)
git fetch origin
git merge origin/dev

# 2. Stage, commit, push only your branch
git add profile_get.php profile_update.php login.php profile.html docs/
git status
git commit -m "Implement profile page backend: profile_get (PDO), profile_update, session on login, wire profile.html, add docs"
git push -u origin 28-profile-page-backend
```
