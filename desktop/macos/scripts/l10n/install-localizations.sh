#!/usr/bin/env bash
# Copy desktop/macos/Localization/*.lproj into an assembled app bundle.
#
# SwiftUI resolves Text("…") literals against Bundle.main, i.e. the app's own
# Contents/Resources — not SwiftPM's nested "Omi Computer_Omi Computer.bundle" —
# so the tables are installed there. Used by run.sh and the Codemagic release build.
#
#   scripts/l10n/install-localizations.sh "/Applications/Omi Dev.app"
set -euo pipefail

app_bundle="${1:?usage: install-localizations.sh <path/to/App.app>}"
source_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../Localization" && pwd)"
resources="$app_bundle/Contents/Resources"

mkdir -p "$resources"
installed=0
for lproj in "$source_dir"/*.lproj; do
  [ -d "$lproj" ] || continue
  name="$(basename "$lproj")"
  rm -rf "${resources:?}/$name"
  cp -R "$lproj" "$resources/$name"
  installed=$((installed + 1))
done
echo "Installed $installed localization(s) into $resources"
