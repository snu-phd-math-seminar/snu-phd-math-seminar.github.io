# Kernel → Cokernel Circle

Website for the **Kernel → Cokernel Circle**, the PhD mathematics seminar series
at the Department of Mathematics, Shiv Nadar Institute of Eminence.

Live site: https://snu-phd-math-seminar.github.io

## How it works
A static site served by GitHub Pages. There is no build step.

| Path | Purpose |
|---|---|
| `index.html` | Page structure, announcements, organizers, advisor |
| `data.json` | All talks (the schedule, past lectures, gallery and upcoming card are generated from it) |
| `scripts/main.js` | Loads `data.json` and renders the page; holds `SEMINAR_CONFIG` (day, time, default hall) |
| `styles/main.css` | Styling |
| `assets/notes/`, `assets/abstracts/` | Talk notes and abstract PDFs |
| `images/` | Speaker photos used in the gallery |
| `.github/` | Issue forms, workflows and scripts that let organizers update `data.json` without touching code |

## Updating the site
Organizers add and edit talks through GitHub Issue Forms (no code or JSON
editing needed). See [SETUP.md](SETUP.md) for the one-time setup and usage.

Announcements and the organizer list are plain HTML in `index.html`. The weekly
day, time and default hall are set once in the `SEMINAR_CONFIG` block at the top
of `scripts/main.js`.

## Previewing locally
The page loads `data.json` with `fetch`, so it must be served over HTTP
(opening `index.html` directly from disk won't work):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Data format
Each entry in `data.json` → `lectures`:

```json
{
  "date": "2026-12-03",
  "title": "Talk title (LaTeX like \\(x^2\\) is supported)",
  "speaker": "Speaker Name",
  "location": "optional, defaults to the usual hall on the site",
  "topic": "Algebra",
  "abstract_text": "Plain-text abstract (optional)",
  "abstract": "assets/abstracts/name_abstract.pdf (optional)",
  "notes": "assets/notes/name_notes.pdf (optional)",
  "image": "images/name.jpg (optional)"
}
```

`topic` drives the schedule filter buttons, so use a topic that matches one of
the keywords in the filter bar in `index.html`.
