# Repository Guidelines

## Project Structure

This workspace contains the product requirements and design reference for 옷 고르기, a mobile-first outerwear recommendation app. Use `PRD.md` for MVP scope, recommendation rules, and weather fallbacks. Use `DESIGN-clay.md` for visual tokens, components, and responsive behavior.

The planned app uses `index.html`, `style.css`, and `app.js` at the repository root. Keep weather requests in `weather.js`, recommendation logic in `rules.js`, browser persistence in `storage.js`, and district coordinates in `regions.json`. The app source and automated tests have not been created yet.

## Local Development

After app files exist, run `python -m http.server 8000` from the project root and open `http://localhost:8000`. The MVP uses plain HTML, CSS, and JavaScript without a build step.

## Style and Naming

Use lowercase filenames and mobile-first CSS. Check layouts at a 360 px viewport. Preserve documented localStorage fields such as `feelsLike` and `manualTemp`. No formatter or linter is configured yet.

## Testing

There is no automated test suite or coverage target yet. For future changes, manually verify first-run setup, outfit logging, persistence after reload, recommendations at the ±2°C boundary, and manual temperature entry when weather lookup fails.

## Commits and Pull Requests

Use short, imperative commit subjects, for example `Document manual temperature fallback`. Pull requests should describe the affected requirement and validation performed. Link a related issue when available and include a mobile screenshot for visible changes.
