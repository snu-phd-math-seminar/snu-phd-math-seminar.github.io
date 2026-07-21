# Organizer-friendly editing — setup

## What this gives you
Any of the 5 organizers can now:
- Click "New issue" → "🎤 New Talk" → fill a form → talk is auto-added to `data.json` and the site updates.
- Click "New issue" → "✏️ Edit Introduction" → paste new text → `intro.json` is updated and the site updates.

No one needs to touch JSON, git, or code directly.

## One-time setup

1. Copy these into your repo, preserving paths:
   - `.github/ISSUE_TEMPLATE/new-talk.yml`
   - `.github/ISSUE_TEMPLATE/edit-intro.yml`
   - `.github/workflows/add-talk.yml`
   - `.github/workflows/edit-intro.yml`
   - `scripts/add_talk.py`
   - `scripts/update_intro.py`
   - `intro.json` (only if you don't already have an intro file — see step 3)

2. In your repo's **Settings → Actions → General → Workflow permissions**, make sure
   "Read and write permissions" is selected (needed so the Action can push commits).

3. Wire up the introduction text. Wherever `main.js` / `index.html` currently
   renders the hardcoded intro text, replace it with something like:

   ```js
   fetch('intro.json')
     .then(res => res.json())
     .then(data => {
       document.getElementById('intro').innerHTML = data.introduction;
     });
   ```

   (Adjust `'intro'` to whatever element id currently holds the intro text —
   you'll need to find that one spot in `main.js`/`index.html` and swap it in.)

4. Make sure your organizers are collaborators on the GitHub repo (so they can
   open issues) — they don't need write access, just enough to open an issue.

## How organizers use it day to day
- **New talk:** GitHub repo → Issues → New issue → "🎤 New Talk" → fill in
  title, speaker, date (blank = today), location, topic, abstract (paste text,
  or drag-and-drop a PDF right into the abstract box), speaker image, notes.
  Submit → within ~30 seconds the bot comments "done" and closes the issue.
- **Edit introduction:** Issues → New issue → "✏️ Edit Introduction" → paste
  the full new text → submit.

## Notes / things to double check
- New abstract/notes PDFs and images are saved as
  `assets/abstracts/<speakerfirstname>_abstract.pdf`,
  `assets/notes/<speakerfirstname>_notes.pdf`, `images/<speakerfirstname>.jpg`.
  If a speaker gives a second talk, the script auto-appends `2`, `3`, etc. to
  avoid overwriting the first file.
- The "location" field is new — it wasn't in your existing `data.json` entries,
  so it'll just show up empty (`""`) for past talks until you fill it in.
- Talks are auto re-sorted by date after each addition.
- The bot commits straight to your default branch. If you'd rather review
  changes first, this can be changed to open a pull request instead — say
  the word and I'll adjust it.
