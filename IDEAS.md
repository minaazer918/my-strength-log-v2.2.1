# My Strength Log: Ideas and Backlog

Place this file in the project root, next to `CHANGELOG.md`.

Last updated: 2026-10-11 (added #7 and #8)

## How to use this file

- Add new ideas at the bottom of the matching section, with the next free ID.
- Status values: **Idea** → **Discussed** → **Approved** → **Done** (add the version, e.g. `Done in 1.2.0`).
- An idea is not implemented until its status is **Approved** and a release is requested.
- Every implemented change still follows the project rules (minimal change, `CHANGELOG.md` entry, SemVer, tests, completion report).
- Sections: Features, Fixes, Improvements. IDs are never reused.

## Features

### #1 Rest timer on the main screen
- **Status:** Idea
- **Suggested version type:** MINOR
- Move the timer to the main screen.
- Let the user enter the rest time.
- Play a sound and vibrate when the timer ends.
- **Notes for discussion:**
  - Sound needs a prior tap in browsers.
  - Vibration works on Android Chrome but not on iOS Safari (use sound plus a visual flash there).
  - Base the timer on an end timestamp so it stays accurate if the screen locks.
  - Open questions: remember the rest time between sessions? Auto-start after saving a set?

### #2 Custom exercises
- **Status:** Approved (built as 2.0.0, pending release approval)
- **Suggested version type:** MINOR (needs a data-safety plan first)
- Let the user add and enter their own exercises, not only Squat and Deadlift.
- **Notes for discussion:**
  - Keep Squat and Deadlift as built-in defaults and add a separate exercise list so existing records stay untouched.
  - If a database version upgrade is needed, plan a migration and a backup/export step first.
  - Open questions: per-exercise sets/reps (e.g. 4x8)? History kept per exercise?

### #3 Per-set effort tracking (RIR and tags)
- **Status:** Idea
- **Suggested version type:** MINOR
- Track RIR (reps in reserve) for each set.
- Keep per-set feel tags: easy / medium / hard, fast / slow, form issues.
- **Notes for discussion:**
  - RIR and easy/medium/hard overlap. Keep both, or make RIR the main field with a label shortcut?
  - Add as new optional fields on each set. Old sets show them blank.
  - Use one-tap buttons so saving a set stays fast. All fields optional.

### #4 Cloud backup and sync
- **Status:** Idea
- **Suggested version type:** Split into steps (see below)
- Let users connect their preferred cloud service: Google Drive, Microsoft OneDrive, and possibly other storage providers.
- Requirements:
  - Secure authorization and permission management.
  - User-selected backup destination.
  - Upload, download, and restore.
  - Conflict handling when workout data changes on multiple devices.
  - Clear separation between backup and full two-way sync.
- **Suggested split:**
  - **#4a Manual export/import file (JSON).** No accounts or servers. MINOR.
  - **#4b Cloud backup/restore** to a user-chosen provider (upload, download, restore only). MINOR.
  - **#4c Full two-way sync** with conflict handling. Possibly MAJOR.
- **Notes for discussion:**
  - A PWA has no server of its own. Google Drive and OneDrive need OAuth sign-in and app registration with each provider, HTTPS hosting, and careful token storage.
  - Restore can overwrite workouts: require a confirmation step and an automatic local backup before any restore.
  - Conflicts (4c): "newest wins" vs. merging by set. Merging is safer but needs unique IDs and timestamps on every set.

### #5 Workout data analysis and graphs
- **Status:** Idea
- **Suggested version type:** MINOR (suggest splitting)
- Visualize weight, repetitions, sets, and training volume over time.
- Show progression and regression for each exercise.
- Track estimated one-repetition maximum (1RM).
- Compare workout sessions and identify trends.
- Summarize consistency, personal records, and training history.
- **Suggested split:** #5a per-exercise charts and PRs; #5b consistency summaries and session comparison.
- **Notes for discussion:**
  - Read-only on existing data, so low risk to records.
  - Works best after #2 and #3 (more exercises and effort data).
  - Estimated 1RM is a formula (e.g. Epley), most reliable for sets of about 10 reps or fewer. Label it "estimated".
  - Charts need a drawing method. A library adds a dependency, which conflicts with the no-new-dependencies rule, so decide explicitly or draw simple charts by hand.

### #6 AI coaching (CSCS and ACSM informed)
- **Status:** Idea
- **Suggested version type:** MINOR, possibly MAJOR for an AI-service version
- Develop an AI coaching capability informed by CSCS principles and American College of Sports Medicine (ACSM) exercise guidelines.
- Analyze workout history and training performance.
- Recommend progressive overload and appropriate weight increases.
- Suggest sets, repetitions, rest intervals, and training frequency.
- Identify plateaus, excessive fatigue, and potential under-recovery.
- Adapt recommendations to training goals, experience, and available equipment.
- Explain recommendations and their supporting rationale.
- **Important:** Recommendations should be evidence-informed, distinguish established guidelines from estimates, and account for safety and individual limitations.
- **Notes for discussion:**
  - **Rules-based coach (offline) first:** fixed, predictable, private, testable logic (e.g. progress weight when all reps are hit at a low RIR).
  - **True AI coach later:** needs an AI service, which means a server or API key, cost, privacy decisions, and sending workout data off the device. A PWA cannot safely hold an API key itself. Comes after cloud work (#4).
  - Tag each recommendation as "Guideline-based" or "Estimate".
  - Show a standing "not medical advice" note and a "stop and see a professional" prompt for pain or injury.
  - Fatigue and under-recovery flags need logged data (RIR, effort, possibly soreness), so #3 is a prerequisite.
  - With little history, say there is not enough data rather than guess.

### #7 Security and privacy
- **Status:** Idea
- **Suggested version type:** Review checklist plus small MINOR items (e.g. app PIN lock)
- Consider securing the app and protecting user privacy.
- **Notes for discussion:**
  - Current baseline is good: data stays on the device, with no accounts and no server.
  - Hosting: HTTPS only, plus security headers such as a Content Security Policy.
  - Code hygiene: no third-party scripts, and safe handling of anything the user types (exercise names, notes) so it cannot inject code.
  - Data protection: optionally encrypt exported files and cloud backups; optional app PIN or lock screen for shared phones (treat as a small separate feature).
  - Privacy: a short privacy policy stating what is stored and where. If selling to people in regions such as the EU, privacy law (e.g. GDPR) applies.
  - Cloud (#4) and AI coaching (#6) send data off the device, so they need consent screens and clear explanations.
  - Do this review before cloud features and before selling.

### #8 Locking the app for sale to individuals
- **Status:** Idea
- **Suggested version type:** MINOR or MAJOR depending on the approach
- Possibly lock the app so it can be sold to individuals (e.g. locked by phone number, a locking/license code, etc.).
- **Notes for discussion:**
  - A PWA runs on the user's own device, so any lock inside the app can eventually be bypassed. It deters casual sharing, not determined copying.
  - Phone-number locking is a poor fit: a PWA cannot read the phone number. It would need SMS verification (paid service, collects phone numbers, privacy burden). Email or a license code is simpler.
  - Options, simplest to strongest:
    1. License key sold through a platform (e.g. Gumroad, Lemon Squeezy) and entered once in the app. Easy, but keys can be shared.
    2. License key checked by a small server, limited to a number of devices. Stronger, but needs a server and upkeep.
    3. App store distribution (e.g. Google Play) wrapping the PWA. The store handles payment and licensing, but adds fees and a larger rewrite.
  - Open questions: one-time price or subscription? Free trial? Devices per buyer? How much copying is acceptable?
  - Depends on hosting and payment decisions, so place late in the build order. Needs #7 first.

## Fixes

_None recorded yet._

## Improvements

_None recorded yet._

## Suggested build order

Based on dependencies and risk (not yet approved):

1. #4a Manual export/import (safety net before data-affecting changes)
2. #1 Rest timer
3. #3 RIR and set tags
4. #2 Custom exercises
5. #7 Security and privacy review (before cloud and before selling)
6. #5 Analysis and graphs
7. #6 AI coaching (rules-based first)
8. #4b Cloud backup, then #4c two-way sync
9. #8 Licensing and locking for sale

## Workflow reminders

- One item per chat, started inside this Project, with the latest project ZIP attached.
- Ask for a plan first (files to touch, risk to workout data), then approve before any code.
- Complex items (#2, #4) get a plan-only chat before the build chat.
