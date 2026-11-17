# Plan: Run Tutor + Student simultaneously on one Fedora PC without token collision

## Goal
Launch two Ghost-Touch Electron instances on the same Fedora Linux machine — one logged in as a Tutor (→ `/tutor/dashboard`), one as a Student (→ `/student/join`) — with fully isolated auth state so `gt_token`/`gt_user` never collide.

## Root cause (why they collide today)
`src/store/authStore.js` persists auth to `localStorage` under fixed keys:
- `gt_token`
- `gt_session` (JSON user)
- `gt_user`

A single Electron `user-data-dir` shares one `localStorage` origin across all windows of that app instance. Logging in as Tutor overwrites the Student token (and vice versa).

## Recommended approach: two Electron instances, isolated `--user-data-dir`
Run `electron .` twice, each with a distinct `--user-data-dir`. Chromium isolates `localStorage`, cookies, cache, and IndexedDB per `user-data-dir`, so each instance has its own auth store. No code changes required.

### Terminal 1 — Tutor
```bash
cd /home/DIREWOLFE-X/PROJECTS/Ghost-Touch-Premier
npm run build
electron . --user-data-dir=/tmp/gt-tutor
```
- In that window: sign up / log in as **Tutor**.
- Router navigates to `/tutor/dashboard` → `TutorStudio`.
- Token saved to `/tmp/gt-tutor` localStorage only.

### Terminal 2 — Student
```bash
cd /home/DIREWOLFE-X/PROJECTS/Ghost-Touch-Premier
electron . --user-data-dir=/tmp/gt-student
```
- In that window: sign up / log in as **Student**.
- Router navigates to `/student/join` → `StudentJoin`.
- Token saved to `/tmp/gt-student` localStorage only.

Both run `HashRouter` over `file://`, so no `BrowserRouter`/server port conflicts. Auth is mock/localStorage (already implemented), so there is **no backend** on `localhost:3001` to contend for.

## Why this works for judges
- Each instance is a complete, independent login flow; judges can click through Tutor signup → dashboard and Student signup → join side by side.
- No token collision because `localStorage` origins differ.
- Deterministic and demo-friendly; no native `better-sqlite3`/`socket.io` server to start.

## Constraints / risks
- **Camera contention**: SmartSpectra `getUserMedia` is per-instance. If both tutors try to Start camera at the same time, the second may fail or grab the same device. Advise judges to only run camera in one instance at a time for the demo; auth flow itself is unaffected.
- **Two windows**: This is two OS windows, not one split pane. Acceptable for simultaneous demo.
- **Cleanup**: `/tmp/gt-tutor` and `/tmp/gt-student` persist across reboots unless cleared. For a fresh demo, delete them before re-running.

## Out of scope (not implemented)
- Single-window multi-account (role-keyed `localStorage` such as `gt_token_tutor`/`gt_token_student`). Would require store changes + UI to switch accounts; more complex and not needed for side-by-side demo.
- Real Express + `better-sqlite3` backend. Deliberately avoided for judge reliability; mock auth already in place.

## Validation steps
1. `npm run build` succeeds → `dist/renderer.bundle.js` generated.
2. Launch tutor instance, sign up as tutor, confirm URL shows `#/tutor/dashboard` and TutorStudio renders.
3. Launch student instance, sign up as student, confirm URL shows `#/student/join` and StudentJoin renders.
4. Confirm tutor token still intact when switching back to tutor window (no overwrite).
