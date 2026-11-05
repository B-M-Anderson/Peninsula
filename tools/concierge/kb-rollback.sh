#!/usr/bin/env bash
# kb-rollback.sh: put a previous profile back live. The poller reloads on its own.
#
#   kb-rollback.sh                          the newest backup
#   kb-rollback.sh backups/profile-DATE.md  a specific one
#   kb-rollback.sh --list
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
KB="${CONCIERGE_KB_DIR:-$HOME/concierge-kb}"
cd "$KB"
if [ "${1:-}" = "--list" ]; then ls -1t backups/profile-*.md; exit 0; fi
TARGET="${1:-$(ls -1t backups/profile-*.md | head -1)}"
[ -f "$TARGET" ] || { echo "no such backup: $TARGET" >&2; exit 1; }
python3 "$HERE/build_kb.py" --check "$TARGET"
cp profile.md "backups/profile-$(date +%Y%m%d-%H%M%S)-before-rollback.md"
cp "$TARGET" profile.md.tmp && mv profile.md.tmp profile.md
python3 "$HERE/build_kb.py" --profile profile.md
git add profile.md backups
git commit --quiet -m "Roll back to $(basename "$TARGET")" && git push --quiet \
  || echo "warning: the live KB rolled back, but the commit or push failed" >&2
echo "live KB is now $(basename "$TARGET")"
