'use strict';
// Suggested exercises for the Add exercise screen. Ids are permanent: never reuse or change an id.
// To add a suggestion, append a row [id (a-z, 0-9, hyphen), name, movement type]; see CATS in app.js.
const PRESETS = [
  ['squat', 'Squat', 'Squat'], ['front-squat', 'Front Squat', 'Squat'], ['goblet-squat', 'Goblet Squat', 'Squat'],
  ['leg-press', 'Leg Press', 'Squat'], ['lunge', 'Lunge', 'Squat'], ['bulgarian-split-squat', 'Bulgarian Split Squat', 'Squat'],
  ['leg-extension', 'Leg Extension', 'Squat'], ['calf-raise', 'Calf Raise', 'Squat'],
  ['deadlift', 'Deadlift', 'Hinge'], ['romanian-deadlift', 'Romanian Deadlift', 'Hinge'], ['sumo-deadlift', 'Sumo Deadlift', 'Hinge'],
  ['hip-thrust', 'Hip Thrust', 'Hinge'], ['good-morning', 'Good Morning', 'Hinge'], ['leg-curl', 'Leg Curl', 'Hinge'],
  ['bench-press', 'Bench Press', 'Push'], ['incline-bench-press', 'Incline Bench Press', 'Push'], ['dumbbell-bench-press', 'Dumbbell Bench Press', 'Push'],
  ['incline-dumbbell-press', 'Incline Dumbbell Press', 'Push'], ['overhead-press', 'Overhead Press', 'Push'], ['dumbbell-shoulder-press', 'Dumbbell Shoulder Press', 'Push'],
  ['dips', 'Dips', 'Push'], ['push-up', 'Push-Up', 'Push'], ['lateral-raise', 'Lateral Raise', 'Push'], ['triceps-pushdown', 'Triceps Pushdown', 'Push'],
  ['barbell-row', 'Barbell Row', 'Pull'], ['dumbbell-row', 'Dumbbell Row', 'Pull'], ['seated-cable-row', 'Seated Cable Row', 'Pull'],
  ['pull-up', 'Pull-Up', 'Pull'], ['chin-up', 'Chin-Up', 'Pull'], ['lat-pulldown', 'Lat Pulldown', 'Pull'],
  ['face-pull', 'Face Pull', 'Pull'], ['barbell-curl', 'Barbell Curl', 'Pull'], ['dumbbell-curl', 'Dumbbell Curl', 'Pull'],
  ['plank', 'Plank', 'Core'], ['hanging-leg-raise', 'Hanging Leg Raise', 'Core'], ['cable-crunch', 'Cable Crunch', 'Core'],
  ['farmers-walk', "Farmer's Walk", 'Other']
].map(r => ({id: r[0], name: r[1], cat: r[2]}));
