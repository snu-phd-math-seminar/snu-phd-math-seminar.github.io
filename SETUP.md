# Organizer guide: editing the seminar site

The site is driven by `data.json`. Organizers never need to edit it by hand:
two GitHub Issue Forms do it for them, and a GitHub Action commits the change.

## Who can use it
Only the repo owner, org members, and **collaborators** can trigger the forms
(the workflows ignore issues from anyone else). Collaborators with just "Read"
access are enough, since they only need to open issues.

## One-time setup
1. **Settings → Actions → General → Workflow permissions** → select
   **Read and write permissions**.
2. **Issues → Labels** → make sure these two labels exist (create them if not):
   `new-talk` and `edit-talk`. The forms apply them automatically, and the
   workflows trigger on them.
3. Add every organizer as a collaborator on the repo.

## Day-to-day use

### Add a talk
Issues → New issue → **🎤 New Talk** → fill in the form → Submit.
- **Date** blank = today's date. Otherwise use `YYYY-MM-DD`.
- **Abstract PDF / Speaker Image / Notes PDF**: drag and drop the file into the
  box (or leave blank). The bot downloads it into the repo.
- Within about 30 seconds the bot comments, closes the issue, and the site
  updates.

### Edit a talk
Issues → New issue → **🛠️ Edit Talk** → enter the talk's **current date** as it
appears on the site → fill in only the fields you want to change.
- Blank fields are left untouched.
- To reschedule, put the new date in **New Date**.
- The form cannot erase a field. To clear something, edit `data.json` directly.

### If something fails
The bot leaves the issue **open** and comments with the likely cause (usually a
date that doesn't match, or isn't in `YYYY-MM-DD` format). Close that issue and
open a fresh one. Details are in the repo's **Actions** tab.

## Where files go
| Upload | Saved as |
|---|---|
| Abstract PDF | `assets/abstracts/<speakerfirstname>_abstract.pdf` |
| Notes PDF | `assets/notes/<speakerfirstname>_notes.pdf` |
| Speaker image | `images/<speakerfirstname>.jpg` |

If a speaker gives a second talk, the script appends `2`, `3`, … to the file
name so earlier files are never overwritten. Talks are re-sorted by date after
every change.

## Repo layout (the parts that matter)
```
.github/ISSUE_TEMPLATE/   new-talk.yml, edit-talk.yml   (the forms)
.github/workflows/        add-talk.yml, edit-talk.yml    (the automation)
.github/scripts/          add_talk.py, edit_talk.py      (the logic)
data.json                 all talks
index.html, scripts/, styles/   the site itself
```

## Notes
- The bot commits straight to the default branch. If you'd rather review
  changes first, the workflows can be changed to open a pull request instead.
- Announcements, the organizer list, the header details (time, hall) and the
  advisor card are plain HTML in `index.html` and are edited there.
