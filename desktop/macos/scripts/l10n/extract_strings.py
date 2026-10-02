#!/usr/bin/env python3
"""Extract user-facing SwiftUI string literals and check them against a .strings table.

Usage:
  scripts/l10n/extract_strings.py                 # list literal keys missing from es.lproj
  scripts/l10n/extract_strings.py --lang es --json  # dump {key: [source locations]} as JSON

Only plain literals are collected (Text("..."), Button("..."), Label("..."), ...).
Literals containing interpolation (\\(...)) become format keys (%@, %lld) in SwiftUI
and are reported separately because their key depends on the interpolated types.
"""

import argparse
import json
import pathlib
import re
import sys

MACOS_ROOT = pathlib.Path(__file__).resolve().parents[2]
SOURCES = MACOS_ROOT / "Desktop" / "Sources"
LOCALIZATION = MACOS_ROOT / "Localization"

CALL = re.compile(
  r'\b(Text|Button|Label|Toggle|Section|Picker|TextField|SecureField|Menu|Link|navigationTitle|help'
  r'|DisclosureGroup|Tab|GroupBox)\(\s*"((?:[^"\\]|\\.)*)"'
)
ENTRY = re.compile(r'^"((?:[^"\\]|\\.)*)"\s*=', re.M)


def collect():
  simple, interpolated = {}, {}
  for path in sorted(SOURCES.rglob("*.swift")):
    if "Generated" in path.parts:
      continue
    for lineno, line in enumerate(path.read_text(errors="ignore").splitlines(), 1):
      for match in CALL.finditer(line):
        key = match.group(2)
        if not re.search(r"[A-Za-z]{2}", key):
          continue
        bucket = interpolated if "\\(" in key else simple
        bucket.setdefault(key, []).append(f"{path.relative_to(SOURCES)}:{lineno}")
  return simple, interpolated


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--lang", default="es")
  parser.add_argument("--json", action="store_true")
  args = parser.parse_args()

  simple, interpolated = collect()
  if args.json:
    json.dump({"simple": simple, "interpolated": interpolated}, sys.stdout, ensure_ascii=False, indent=1)
    return

  table = LOCALIZATION / f"{args.lang}.lproj" / "Localizable.strings"
  translated = set(ENTRY.findall(table.read_text())) if table.exists() else set()
  missing = [key for key in simple if key not in translated]
  print(f"{len(simple)} literal keys, {len(simple) - len(missing)} translated, {len(missing)} missing")
  print(f"{len(interpolated)} interpolated keys need manual format-key handling")
  for key in missing:
    print(f"  {key!r}  ({simple[key][0]})")


if __name__ == "__main__":
  main()
