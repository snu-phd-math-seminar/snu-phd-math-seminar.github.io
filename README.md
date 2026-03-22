# Mathematics Seminar Series — Site Maintainer Guide

Personal reference for updating the seminar website hosted at `https://snu-phd-math-seminar.github.io`.

---

## Repo Structure

```
your-repo/
├── index.html        ← main site file, edit this for every update
├── _config.yml       ← site settings, rarely needs editing
├── README.md         ← this file
└── assets/
    └── notes/        ← upload lecture PDFs here
```

---

## Before Each Seminar

Scholar sends you: **title, abstract, date, their name and year**

- [ ] Open `index.html`
- [ ] Find the `<!-- ── UPCOMING ── -->` section
- [ ] Update the following fields:

```html
<p class="tag">Next · DD Month YYYY</p>
<h3>Title of the Talk</h3>
<p class="speaker">Scholar Name — Nth Year PhD, Research Area</p>
<p class="date-line">Friday, DD Month YYYY · 3:00 PM · Hall M-204</p>
```

- [ ] Paste the abstract inside the `<div class="abstract-box">` block
- [ ] LaTeX works directly — use `$...$` for inline and `$$...$$` for display math
- [ ] Update the **Schedule table** — change the row status badge from `badge-tbd` to `badge-upcoming`
- [ ] Commit and push:

```bash
git add index.html
git commit -m "Add abstract: Title of the Talk (DD Mon YYYY)"
git push
```

---

## After Each Seminar

Scholar sends you: **lecture notes as PDF**

- [ ] Rename the PDF using this format:
  ```
  YYYY-MM-DD-short-topic-name.pdf
  ```
  Example: `2026-03-28-spectral-theory.pdf`

- [ ] Upload the PDF to `assets/notes/` on GitHub:
  - Go to your repo → `assets/notes/`
  - Click **Add file → Upload files**
  - Drag and drop the PDF → Commit

- [ ] Open `index.html`
- [ ] Find the current upcoming entry and **move it to the Past Lectures section**
  - Copy the entire `<div class="seminar-entry">` block from the upcoming section template below and paste it at the top of the past lectures list
- [ ] Uncomment the notes download link:
  ```html
  <a class="notes-link" href="assets/notes/YYYY-MM-DD-topic.pdf">Lecture notes (PDF)</a>
  ```
- [ ] Update the **Schedule table** — change the row status badge to `badge-confirmed` and label to `Done`
- [ ] Clear the upcoming card ready for next seminar (or mark as TBA)
- [ ] Commit and push:

```bash
git add index.html assets/notes/YYYY-MM-DD-topic.pdf
git commit -m "Add notes: Title of the Talk (DD Mon YYYY)"
git push
```

---

## Past Lecture Entry Template

Copy this block and fill in the details when moving a seminar to the past lectures section:

```html
<div class="seminar-entry">
  <div class="seminar-date">DD Mon YYYY</div>
  <div class="seminar-info">
    <span class="topic-tag">Research Area</span>
    <h3>Title of the Talk</h3>
    <p class="speaker">Scholar Name — Nth Year PhD</p>
    <details>
      <summary>Abstract</summary>
      <div class="detail-body">
        <p>
          Abstract text goes here. LaTeX works: $\pi_1(X)$ and $$\sum \lambda_n$$.
        </p>
      </div>
    </details>
    <a class="notes-link" href="assets/notes/YYYY-MM-DD-topic.pdf">Lecture notes (PDF)</a>
  </div>
</div>
```

---

## Schedule Table Status Badges

Use the correct badge class in the schedule table:

| Situation       | Badge class         | Label      |
|-----------------|---------------------|------------|
| Talk completed  | `badge-confirmed`   | `Done`     |
| Next upcoming   | `badge-upcoming`    | `Upcoming` |
| Not yet assigned| `badge-tbd`         | `Open`     |

---

## Updating Site Info

Edit `_config.yml` if you need to change:
- Site title or description
- University name or contact email
- GitHub Pages URL

Edit `index.html` header section for:
- Seminar timings or venue
- Academic year label

---

## Quick Git Reference

```bash
# Check what has changed
git status

# Stage all changes
git add .

# Commit with a message
git commit -m "your message here"

# Push to GitHub (site updates in ~1 min)
git push

# Pull latest if editing from multiple machines
git pull
```

---

## LaTeX Quick Reference

| What          | Syntax                          | Renders as              |
|---------------|---------------------------------|-------------------------|
| Inline math   | `$\pi_1(X, x_0)$`              | π₁(X, x₀)              |
| Display math  | `$$\sum_{n=1}^\infty \lambda_n$$` | centred equation block |
| Fraction      | `$\frac{a}{b}$`                | a/b                     |
| Subscript     | `$x_n$`                        | xₙ                      |
| Superscript   | `$x^2$`                        | x²                      |
| Set notation  | `$\mathbb{R}^n$`               | ℝⁿ                      |
| Norm          | `$\|f\|_{L^2}$`                | ‖f‖_L²                  |

---

*Last updated: March 2026*
