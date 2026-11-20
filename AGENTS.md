# Repository Guidelines

## Project Structure

This workspace currently contains two Markdown specifications for 옷 고르기, a mobile-first outerwear recommendation app. Use [PRD.md](PRD.md) for MVP scope, recommendation rules, and weather fallbacks. Use [DESIGN-clay.md](DESIGN-clay.md) for visual tokens, components, and responsive behavior.

The PRD’s planned root layout uses `index.html` for the three screens, `style.css` for styles, and `app.js` for hash navigation and events. Keep Open-Meteo requests and temperature aggregation in `weather.js`, recommendation logic in `rules.js`, browser persistence in `storage.js`, and district coordinates in `regions.json`. Source, test, and asset directories are not present yet.

## Local Development

Once the app files exist, run `python -m http.server 8000` from the project root and open `http://localhost:8000`. Serving over HTTP lets the browser load `regions.json` and gives localStorage a consistent origin. The PRD specifies plain HTML, CSS, and JavaScript with no install or build step and static deployment on Vercel.

## Style and Naming

Follow the lowercase filenames in the PRD. Use mobile-first CSS and check the layout at the specified 360 px baseline. Preserve the documented localStorage field names, such as `feelsLike` and `manualTemp`, when changing persistence. Code indentation, linting, and formatting conventions are still open.

## Testing

The workspace has no automated test suite or coverage target. For specification changes, check affected requirements, examples, and data definitions for consistency. Once implemented, manually verify first-run setup, outfit logging, persistence after reload, and recommendations at the ±2°C boundary. Simulate a weather request failure and verify that manual temperature entry works.

## Commits and Pull Requests

This workspace has no Git history to establish a commit convention. Use short, imperative summaries such as “Clarify manual temperature fallback.” In a pull request, describe the affected requirement and validation performed. Link a related issue when available and include a mobile screenshot for visible changes.

