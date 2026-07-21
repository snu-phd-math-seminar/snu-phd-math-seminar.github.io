#!/usr/bin/env python3
"""
Parses a "New Talk" GitHub Issue Form submission and appends the talk
to data.json, downloading any drag-and-dropped attachments (abstract PDF,
speaker image, notes PDF) into the right assets/ subfolders.

Expected env vars:
  ISSUE_BODY   - the raw issue body (GitHub issue-form markdown)
  DATA_JSON    - path to data.json (default: data.json)
"""
import os
import re
import json
import unicodedata
import urllib.request
from datetime import date

DATA_JSON = os.environ.get("DATA_JSON", "data.json")
ISSUE_BODY = os.environ["ISSUE_BODY"]

# --- 1. Parse "### Label\n\nvalue" sections produced by issue forms ---
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
    """
    raw_text may be:
      - empty -> ("", None)
      - a GitHub-uploaded attachment markdown/link -> download it
      - a plain existing relative path the organizer typed -> use as-is
    Returns the path to store in data.json.
    """
    if not raw_text:
        return ""

    url_match = re.search(r"(https?://\S+?)(?:\)|\s|$)", raw_text)
    if url_match:
        url = url_match.group(1)
        ext = os.path.splitext(url.split("?")[0])[1] or kind_ext_default
        os.makedirs(folder, exist_ok=True)
        dest = unique_path(folder, base, ext)
        urllib.request.urlretrieve(url, dest)
        return dest

    # Not a URL -> assume the organizer typed an existing relative path
    return raw_text.strip()


# --- 2. Extract fields ---
title = get("Talk Title", "Untitled Talk")
speaker = get("Speaker", "TBA")
raw_date = get("Date")
talk_date = raw_date if raw_date else date.today().isoformat()
location = get("Location", "")
topic = get("Topic", "")
abstract_text = get("Abstract (plain text", "")

slug = slugify(speaker)

abstract_path = resolve_attachment(
    get("Abstract PDF", ""), "assets/abstracts", f"{slug}_abstract", ".pdf"
)
image_path = resolve_attachment(
    get("Speaker Image", ""), "images", slug, ".jpg"
)
notes_path = resolve_attachment(
    get("Notes PDF", ""), "assets/notes", f"{slug}_notes", ".pdf"
)

new_entry = {
    "date": talk_date,
    "title": title,
    "speaker": speaker,
    "location": location,
    "topic": topic,
    "abstract_text": abstract_text,
    "abstract": abstract_path,
    "notes": notes_path,
}
if image_path:
    new_entry["image"] = image_path

# --- 3. Load, append, sort, save ---
with open(DATA_JSON, "r", encoding="utf-8") as f:
    data = json.load(f)

data.setdefault("lectures", []).append(new_entry)
data["lectures"].sort(key=lambda t: t.get("date", ""))

with open(DATA_JSON, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"Added talk '{title}' by {speaker} on {talk_date}")
