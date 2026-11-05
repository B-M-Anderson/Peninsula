#!/usr/bin/env bash
# refresh.sh: update the private KB from Bennett's current content, swap it in,
# test it, and roll back on failure. Runs from concierge-kb-refresh.timer.
#
#   refresh.sh            the real thing
#   refresh.sh --dry-run  gather, merge, and validate; change nothing live
set -uo pipefail

DRY=0; [ "${1:-}" = "--dry-run" ] && DRY=1
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
KB="${CONCIERGE_KB_DIR:-$HOME/concierge-kb}"
WORK="$KB/build/refresh"
# The smoke test and the poller read this; pointing it at $KB keeps a test run on a
# scratch copy away from the live index.
export CONCIERGE_KB="$KB/build/index.json"
TODAY="$(date +%F)"
STAMP="$(date +%Y%m%d)"
CLAUDE="${CLAUDE_BIN:-$HOME/.local/bin/claude}"
SUBSTACK="https://bennettmanderson.substack.com/feed"
YOUTUBE="https://www.youtube.com/feeds/videos.xml?channel_id=UCY7H6pvaCxxdUModczjw_ew"
export PATH="$HOME/.local/bin:$PATH" CONCIERGE_KB_DIR="$KB"

notify() { python3 "$HERE/kb_notify.py" "$WORK" "$1" || true; }
die() { echo "refresh: $1" >&2; notify "FAILED: $1. The live KB was not changed."; exit 1; }

rm -rf "$WORK"; mkdir -p "$WORK/sources"; chmod 700 "$WORK"
git -C "$KB" pull --quiet --ff-only || die "could not update the concierge-kb clone"
cp "$KB/profile.md" "$WORK/profile.md"
cp "$KB/inbox.md" "$WORK/inbox.md"

# ---- 1. gather (deterministic, no LLM) ---------------------------------------
# Fetch rather than pull: the poller runs from this checkout, so moving its
# working tree here would change the running code as a side effect of a refresh.
git -C "$REPO" fetch --quiet origin main || echo "warning: git fetch failed; using the last known origin/main" >&2
git -C "$REPO" show origin/main:app/data/projects.ts > "$WORK/sources/projects.ts" || die "could not read projects.ts"
git -C "$REPO" show origin/main:public/ResumeBennettAnderson.pdf > "$WORK/resume.pdf" 2>/dev/null \
  && pdftotext -layout "$WORK/resume.pdf" "$WORK/sources/resume.txt" 2>/dev/null
rm -f "$WORK/resume.pdf"
curl -fsSL -m 30 -A concierge-refresh "$SUBSTACK" -o "$WORK/sources/substack.xml" || rm -f "$WORK/sources/substack.xml"
curl -fsSL -m 30 -A concierge-refresh "$YOUTUBE" -o "$WORK/sources/youtube.xml" || rm -f "$WORK/sources/youtube.xml"

# ---- 2. merge (headless Claude Code, no shell, writes only in the work dir) --
PROMPT="$(sed -e "s|\$WORK|$WORK|g" -e "s|\$TODAY|$TODAY|g" "$HERE/refresh_prompt.md")"
# Permission rules take an absolute path as //path. Write is limited to the work dir
# and there is no shell, so the sources can only ever be data to this run.
RULE="/${WORK}/**"
if ! (cd "$WORK" && "$CLAUDE" -p "$PROMPT" --tools "Read,Write,Glob" \
        --allowedTools "Read($RULE)" "Edit($RULE)" "Glob($RULE)" --permission-mode dontAsk \
        --add-dir "$WORK" </dev/null >"$WORK/merge.log" 2>&1) \
   || [ ! -s "$WORK/profile.next.md" ]; then
  notify "SKIPPED: headless Claude Code could not run the merge (see $WORK/merge.log). The live KB was not changed, so the profile is one cycle staler."
  exit 0
fi
[ -s "$WORK/changes.md" ] || echo "(the merge wrote no change summary)" > "$WORK/changes.md"

# ---- 3. validate -------------------------------------------------------------
NOTES=(); [ "$(sed -e "/^Example:/,+1d" "$WORK/inbox.md" | grep -cE "^- *[0-9]{4}-[0-9]{2}-[0-9]{2}:")" -gt 0 ] && NOTES=(--inbox-has-notes)
if ! python3 "$HERE/build_kb.py" --check "$WORK/profile.next.md" --guard-against "$KB/profile.md" "${NOTES[@]}" >"$WORK/check.log" 2>&1; then
  notify "FAILED validation, so the live KB was not changed: $(tr '\n' ' ' < "$WORK/check.log")"
  exit 1
fi
if cmp -s "$WORK/profile.next.md" "$KB/profile.md"; then
  notify "No changes this cycle."
  exit 0
fi
if [ "$DRY" = 1 ]; then
  notify "DRY RUN: validated. Nothing changed. Candidate at $WORK/profile.next.md."
  exit 0
fi

# ---- 4. swap -----------------------------------------------------------------
cp "$KB/profile.md" "$KB/backups/profile-$STAMP.md"
ls -1t "$KB"/backups/profile-*.md 2>/dev/null | tail -n +13 | xargs -r rm -f
cp "$WORK/profile.next.md" "$KB/profile.md.tmp" && mv "$KB/profile.md.tmp" "$KB/profile.md"
if ! python3 "$HERE/build_kb.py" --profile "$KB/profile.md" >>"$WORK/check.log" 2>&1; then
  cp "$KB/backups/profile-$STAMP.md" "$KB/profile.md"
  die "index build failed; restored the previous profile"
fi

# ---- 5. smoke test (the poller reloads on the index's new mtime) -------------
if ! python3 "$HERE/eval/run_eval.py" --core --gate >"$WORK/smoke.log" 2>&1; then
  cp "$KB/backups/profile-$STAMP.md" "$KB/profile.md"
  python3 "$HERE/build_kb.py" --profile "$KB/profile.md" >>"$WORK/check.log" 2>&1
  notify "ROLLED BACK: the new profile failed the smoke test. $(tail -1 "$WORK/smoke.log"). The rejected version is at $WORK/profile.next.md."
  exit 1
fi

# ---- 6. record and notify ----------------------------------------------------
APPLIED="$(sed -n '/^Applied inbox notes:/,$p' "$WORK/changes.md" | grep -E '^- *[0-9]{4}-[0-9]{2}-[0-9]{2}:' || true)"
if [ -n "$APPLIED" ] && [ -s "$WORK/inbox.next.md" ]; then
  printf '%s\n' "$APPLIED" >> "$KB/inbox-archive.md"
  cp "$WORK/inbox.next.md" "$KB/inbox.md"
fi
git -C "$KB" add profile.md inbox.md backups eval
[ -f "$KB/inbox-archive.md" ] && git -C "$KB" add inbox-archive.md
git -C "$KB" commit --quiet -m "Refresh $TODAY" && git -C "$KB" push --quiet \
  || NOTE=" Note: the commit or push to concierge-kb failed, so the private repo is behind the live KB."
notify "Updated and live. Smoke test passed.${NOTE:-}"
