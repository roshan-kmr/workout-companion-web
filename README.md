# Workout Companion Web App

A lightweight web version of the workout tracker designed to be much easier to run than the Android project.

## Run locally

From this folder, run:

```bash
python -m http.server 8000
```

Then open:

http://localhost:8000

## Features

- 5-day workout split
- Exercise-by-exercise set logging
- Warm-up and cool-down phases
- Rest timer
- Weekly summary stats
- PR tracking
- Local persistence using browser localStorage
- No backend required

## Files

- `index.html` – app layout
- `styles.css` – app styling
- `app.js` – workout logic and UI behavior

## Notes

This version is intentionally simpler than the Android version to make rapid iteration and local use much easier.
