# My Strength Log

Personal strength workout log. Users add the exercises they want to track. Plain HTML + CSS + JavaScript, no server, no accounts, no analytics.
Data lives in your browser's IndexedDB and survives closing the browser and restarting the phone.

## Files
index.html, style.css, app.js, exercise-presets.js, manifest.json, sw.js (offline), icon.svg, icon-192.png, icon-512.png

## Try it on a computer
Service workers need https or localhost, so don't just double-click index.html.
    cd my-strength-log
    python3 -m http.server 8000
Open http://localhost:8000

## Put it online (free, simplest first)
1. Netlify Drop: go to https://app.netlify.com/drop and drag the whole `my-strength-log` folder in. You get an https URL.
2. GitHub Pages: upload the files to a new repo, Settings > Pages > deploy from main branch.
3. Cloudflare Pages: create a project and upload the folder.
Any static host with https works.

## Install on your Samsung phone
1. Open the https URL in Chrome (or Samsung Internet) once, while online.
2. Chrome menu (three dots) > "Add to Home screen" / "Install app".
3. Launch it from the icon. After the first load it works offline.

## Backup
Settings > Export Data (JSON or CSV). Settings > Import Data restores a JSON export.
A weight of 0 means bodyweight and is shown as BW.
Clearing browser/site data deletes your workouts, so export regularly.

## Data model
Each workout record: id, exercise, date (YYYY-MM-DD), comment, createdAt, updatedAt, and a sets array
of { workoutId, setNumber, weight (always stored in lb), reps, performance }.
The exercise field is an exercise id. The user's exercise list (id, name, type, hidden) is kept in localStorage and included in JSON exports; the suggestion list is in exercise-presets.js (ids are permanent).
Sets are embedded in the workout so a save is a single atomic write.
