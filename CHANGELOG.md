# Changelog

## 2.2.1 - 2026-10-27
### Changed
- Progression table: the date now shows in a compact form (`Oct 5 ’26`) and the table uses a slightly smaller font and tighter cell padding, so a workout with 4 sets (weight×reps) fits on a phone screen without sideways scrolling. This follows 2.2.0, where the table needed a short swipe to see the last set.
- Only the Progression table changes; History, the workout screens and stored dates keep the full date format.
### Files
- app.js (new `fmtShort` date helper, used only in the Progression table), style.css (two rules scoped to `.tw`, the Progression table container), index.html (footer `v2.2.1`), sw.js (cache `strength-log-v7`), CHANGELOG.md. exercise-presets.js, manifest.json, README.md, the icons and the database structure are unchanged.

### Test results
Verified (headless Chromium, 390 px wide, project served over localhost, service workers blocked):
- `node --check` passes for app.js and sw.js.
- Fit: with 4 sets, the table content width equals the available width (356 px, no sideways scroll) for ordinary values in lb (e.g. 225×8, 315×5, 135×12, 405×3, a December date), in kg (100×8, 102.5×10 style values entered in kg) and for bodyweight (BW×15). The page itself never scrolls sideways.
- Screenshot of the lb table checked: all four sets are visible, the text is smaller but legible, and highlighting is unchanged.
- Worst case (kg values converted from lb with decimals such as 225.97×10, or 3-digit reps such as ×100) is still wider than the screen (about 397 px) and scrolls sideways inside the table box.
- History still shows full dates (e.g. `Oct 1, 2026`), the footer shows `v2.2.1`, and no page errors were logged.

Not verified:
- Appearance on the real Samsung phone and in dark theme, and on phones narrower than 390 px.
- The earlier regression checks (upgrade from v1.1.0 data, fresh install, export/import, delete exercise, bodyweight save) were not re-run for this release because the test scripts were lost when the working environment reset; this release changes only the table display, a date helper and two CSS rules.
- The service worker update path (v6 to v7) on an installed app.


## 2.2.0 - 2026-10-27
### Changed
- The Progression table now shows reps with each weight (for example `225×8`, `BW×12`), so a change in reps at the same weight is visible. The saved screen's "Previous" and "Today" lines show weight×reps the same way, and the table note explains the format.
- Display only: stored workouts are not touched.
### Files
- app.js, index.html (footer `v2.2.0`), sw.js (cache `strength-log-v6`), CHANGELOG.md. style.css, exercise-presets.js, manifest.json, README.md, the icons and the database structure are unchanged.

### Test results
Verified (headless Chromium, 390 px wide, project served over localhost, service workers blocked):
- `node --check` passes for app.js and sw.js; the diff against 2.1.0 contains only the intended display lines plus the cache name.
- Progression table shows weight×reps in lb and kg, and `BW×12` for bodyweight sets. After saving a squat workout the saved screen shows "Previous: 245×5 / 245×5 / 245×4 / 225×12" and "Today: 250×5". History still shows "225 × 8". No page errors were logged.
- Layout: the table sits in its own scroll container and the page itself never scrolls sideways (page width 390). With 4 sets, the table is wider than the phone screen: about 439 px of content in a 356 px container using ordinary values (225×8, 315×5, 135×12), so the last set needs a short swipe sideways. Worst-case values (kg decimals, 3-digit reps) are wider still. In a test, a smaller font and cell padding plus a shorter date (no year, or a two-digit year) made 4 sets fit; this is not included in 2.2.0.

Not verified:
- Appearance on the real Samsung phone and in dark theme.
- The earlier regression checks (upgrade from v1.1.0 data, fresh install, export/import, delete exercise, bodyweight) were not re-run for this release because the test scripts were lost when the working environment reset; this release does not change any of that code.
- The service worker update path (v5 to v6) on an installed app.


## 2.1.0 - 2026-10-26
### Fixed
- Bodyweight exercises (e.g. Push-Up) can now be saved: a weight of 0 is accepted. A blank or non-numeric weight is still rejected.
- Import accepted only weights above 0, which would have dropped bodyweight sets from a backup; it now accepts 0 (a missing or empty weight is still skipped).
### Added
- Weight 0 is shown as "BW" on the saved screen, History, workout detail and the Progression table. The weight-based "next progression" suggestion is not shown when the top weight is BW.
- Settings > My exercises: a Delete button next to Hide. Delete permanently removes the exercise and all of its workouts, after a confirmation that names the exercise and the number of workouts (cannot be undone). Hide still hides the exercise from Home and keeps all history.
### Files
- app.js, index.html (footer `v2.1.0`), sw.js (cache `strength-log-v5`), README.md (one line on BW), CHANGELOG.md. exercise-presets.js, style.css, manifest.json, the icons and the database structure are unchanged.

### Test results
Verified (headless Chromium, 390 px wide, project served over localhost, service workers blocked):
- `node --check` passes for app.js and sw.js.
- Bodyweight: weight 0 saves; the saved screen, History, Progression table and workout detail show BW; no "next progression" suggestion for BW; a blank or non-numeric weight is still rejected; an existing weight-0 workout reopens showing 0 and re-saves; a JSON export containing a weight-0 set imports back with all workouts.
- Delete: dismissing the confirmation deletes nothing; confirming removes the exercise and only its workouts (the confirmation text names the number of workouts and says it cannot be undone); other exercises' workouts are unchanged; the deleted exercise stays gone after reload and is gone from Home; deleting an exercise with no workouts uses a simple confirmation.
- Hide still removes the exercise from Home and keeps its history.
- Regression: the 24 checks from 2.0.0 (upgrade from v1.1.0 data, fresh install, export/import, fallback) all pass, including the footer showing `v2.1.0`. No page errors were logged.
- style.css, exercise-presets.js, manifest.json and the icons are unchanged from 2.0.0.

Not verified:
- Appearance and the delete/BW flows on the real Samsung phone, and in dark theme.
- The service worker update path (v4 to v5) on an installed app.
- Edit, delete workout, kg conversion and rest timer beyond the cases above.


## 2.0.0 - 2026-10-26
### Changed
- The app now starts with a clean slate: no exercises are built in. Users add the exercises they want to track. Squat and Deadlift are ordinary exercises like any other.
- Existing installs keep their data: workouts saved as `squat` / `deadlift` are recognised automatically and appear as "Squat" and "Deadlift" on Home. No workout record is rewritten and the IndexedDB structure (`strengthlog` v1, `workouts` store) is unchanged.
### Added
- Add exercise screen (Home and Settings): type a name or pick from suggestions, plus a movement type (Squat / Hinge / Push / Pull / Core / Other). Duplicate names are blocked (ignoring capitals and extra spaces); typed names are escaped everywhere they are shown.
- Empty Home shows quick-add buttons (Squat, Deadlift, Bench Press, Overhead Press, Barbell Row).
- Settings > My exercises: Hide / Show an exercise. Hidden exercises keep all history.
- History uses a dropdown filter when there are more than 2 exercises.
- Exercise list is stored in localStorage (`exercises`); suggestions live in the new file `exercise-presets.js` (ids are permanent).
- JSON export (file version 2) now includes the exercise list. Import accepts old v1.1.0 exports and recreates exercises from the workouts in the file; an exercise id with no known name appears as "Unknown exercise".
### Files
- app.js, index.html (script tag, footer `v2.0.0`), sw.js (cache `strength-log-v4`, new file cached), manifest.json and README.md (neutral wording), new exercise-presets.js, CHANGELOG.md. style.css and the icons are unchanged.

### Test results
Verified (headless Chromium, 390 px wide, project served over localhost, service workers blocked; 23 of 24 checks passed, see the failure below):
- `node --check` passes for app.js, sw.js and exercise-presets.js.
- Upgrade: test workouts written by v1.1.0 are byte-identical after loading v2.0.0; Home shows SQUAT and DEADLIFT; History shows both; the Squat form shows the previous workout; the kg unit setting is kept.
- Fresh install: empty Home with prompt; quick-add; typed "squat" matches the suggestion; duplicate, empty and `<img onerror>` names are handled safely; workouts save for added exercises; History dropdown filters; hiding an exercise removes it from Home but keeps its history.
- Export includes exercises; an old-format file imports into a clean profile and recreates Squat, Deadlift and an "Unknown exercise" fallback; a v2 export round-trips; the list is rebuilt from workouts if localStorage is cleared.
- Reported by the user (not run by Claude): after removing v1.1.0 and installing v2.0.0 on their Samsung phone, Squat and Deadlift appeared on the first screen with all previous workout history.
- No page errors were logged. style.css and the icons are byte-identical to the uploaded files.
- One check failed: the footer text in the upgrade test, because the test browser reused its cached v1.1.0 index.html. In a clean browser the footer shows `v2.0.0` and both scripts load.

Not verified:
- Appearance on the phone and in dark theme, the footer text on the phone, and the service worker v3 to v4 update path (the user instead removed v1.1.0 and installed v2.0.0).
- Edit, delete, kg conversion and rest timer after the change (code not changed, not run).
- Suggestion link/form, similar-name warning, merging and category-based features are not included.

## 1.1.0 - 2026-10-10
### Added
- App version (`v1.1.0`) is now shown unobtrusively in a footer at the bottom of every screen.
  - index.html: added a footer element (id `ver`) below `#app`, styled with the existing `--mu` color variable.
  - sw.js: cache name changed from strength-log-v2 to strength-log-v3 so installed apps load the updated index.html.
  - app.js, style.css and the database structure are unchanged; no workout data is touched.
- Version is kept in sync manually: update the footer text in index.html together with this changelog on each approved release.

### Test results
Verified (headless Chromium, 390 px wide phone-size window, project served over localhost):
- `node --check` passes for sw.js and app.js.
- Footer shows `v1.1.0` and is visible on Home, Squat entry, History, Settings and the "Workout saved" screen.
- Saving a one-set test workout still works ("Workout saved" appears) and no page errors were logged.
- After load, the only cache present is `strength-log-v3`.
- Screenshot of the saved screen checked: footer is small, muted and centered below the buttons.
- app.js, style.css, icon-192.png and icon-512.png are byte-identical to the uploaded 1.0.1 files (checksums match).

Not verified:
- Appearance on the real Samsung phone, and in dark theme.
- That an already-installed app upgrades from v2 to v3 and shows v1.1.0 after deployment.
- Edit, delete, import/export, kg mode and rest timer after the update (no code involved changed, but not run).

## 1.0.1 - 2026-10-10
### Fixed
- Individual sets can now be saved, so you can alternate between Squat and Deadlift.
  - app.js: blank unsaved trailing sets are skipped on save; opening an exercise resumes today's workout if it has fewer than 4 sets.
  - sw.js: cache name changed from strength-log-v1 to strength-log-v2 so installed apps load the new app.js.

## 1.0.0 - initial version
- First release.
