#!/usr/bin/env python3
"""
Parses an "Edit Talk" GitHub Issue Form submission and updates the
matching talk (found by its current date) in data.json. Only fields the
organizer actually filled in are overwritten; everything else is left as-is.

Expected env vars:
  ISSUE_BODY   - the raw issue body (GitHub issue-form markdown)
  DATA_JSON    - path to data.json (default: data.json)

Exits with code 1 (and prints an error) if no talk matches target_date,
so the workflow can comment back without closing the issue.
"""
import os
import re
import sys
import json
import unicodedata
import urllib.request

DATA_JSON = os.environ.get("DATA_JSON", "data.json")
ISSUE_BODY = os.environ["ISSUE_BODY"]

sections = re.split(r"^### (.+)$", ISSUE_BODY, flags=re.MULTILINE)[1:]
fields = {}
for i in range(0, len(sections), 2):
    label = sections[i].strip()
    value = sections[i + 1].strip()
    if value == "_No response_":
        value = ""
    fields[label] = value


def get(label_substring, default=""):
    for label, value in fields.items():
        if label_substring.lower() in label.lower():
            return value
    return default


def slugify(name):
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    first = re.split(r"\s+", name.strip())[0] if name.strip() else "speaker"
    return re.sub(r"[^a-zA-Z0-9]", "", first).lower() or "speaker"


def unique_path(folder, base, ext):
    path = f"{folder}/{base}{ext}"
    if not os.path.exists(path):
        return path
    n = 2
    while os.path.exists(f"{folder}/{base}{n}{ext}"):
        n += 1
    return f"{folder}/{base}{n}{ext}"


def resolve_attachment(raw_text, folder, base, kind_ext_default):
    if not raw_text:
        return None  # None = "not provided", distinct from "" = "clear it"

    url_match = re.search(r"(https?://\S+?)(?:\)|\s|$)", raw_text)
    if url_match:
        url = url_match.group(1)
        ext = os.path.splitext(url.split("?")[0])[1] or kind_ext_default
        os.makedirs(folder, exist_ok=True)
        dest = unique_path(folder, base, ext)
        urllib.request.urlretrieve(url, dest)
        return dest

    return raw_text.strip()


target_date = get("Date of the talk to edit", "").strip()

with open(DATA_JSON, "r", encoding="utf-8") as f:
    data = json.load(f)

lectures = data.setdefault("lectures", [])
match = next((lec for lec in lectures if lec.get("date") == target_date), None)

if match is None:
    print(f"ERROR: no talk found with date '{target_date}'. "
          f"Check the date matches exactly what's on the site (YYYY-MM-DD).",
          file=sys.stderr)
    sys.exit(1)

slug = slugify(get("New Speaker") or match.get("speaker", ""))

simple_field_map = {
    "New Title": "title",
    "New Speaker": "speaker",
    "New Location": "location",
    "New Topic": "topic",
    "New Abstract text": "abstract_text",
}
for label, key in simple_field_map.items():
    value = get(label, "")
    if value:
        match[key] = value

new_date = get("New Date").strip()
if new_date:
    match["date"] = new_date

abstract_pdf = resolve_attachment(get("New Abstract PDF", ""), "assets/abstracts", f"{slug}_abstract", ".pdf")
if abstract_pdf is not None:
    match["abstract"] = abstract_pdf

image = resolve_attachment(get("New Speaker Image", ""), "images", slug, ".jpg")
if image is not None:
    match["image"] = image

notes_pdf = resolve_attachment(get("New Notes PDF", ""), "assets/notes", f"{slug}_notes", ".pdf")
if notes_pdf is not None:
    match["notes"] = notes_pdf

lectures.sort(key=lambda t: t.get("date", ""))

with open(DATA_JSON, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"Updated talk originally dated {target_date} (title: {match.get('title')})")
