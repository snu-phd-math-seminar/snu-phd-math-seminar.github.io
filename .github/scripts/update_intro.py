#!/usr/bin/env python3
"""
Parses an "Edit Introduction" GitHub Issue Form submission and overwrites
intro.json with the new text.

Expected env vars:
  ISSUE_BODY  - the raw issue body (GitHub issue-form markdown)
  INTRO_JSON  - path to intro.json (default: intro.json)
"""
import os
import re
import json

INTRO_JSON = os.environ.get("INTRO_JSON", "intro.json")
ISSUE_BODY = os.environ["ISSUE_BODY"]

sections = re.split(r"^### (.+)$", ISSUE_BODY, flags=re.MULTILINE)[1:]
fields = {}
for i in range(0, len(sections), 2):
    label = sections[i].strip()
    value = sections[i + 1].strip()
    fields[label] = value

intro_text = fields.get("Introduction Text", "").strip()

with open(INTRO_JSON, "w", encoding="utf-8") as f:
    json.dump({"introduction": intro_text}, f, indent=2, ensure_ascii=False)
    f.write("\n")

print("Updated introduction text.")
