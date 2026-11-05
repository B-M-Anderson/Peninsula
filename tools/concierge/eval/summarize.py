#!/usr/bin/env python3
"""Compare eval results: summarize.py [DIR]. Prints counts only, no answer text."""
import glob
import json
import os
import sys

d = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/concierge-kb/build/eval")
print(f"{'model':28} {'pass':>7} {'rails':>7} {'private':>8} {'tier':>6} {'faith':>7} {'reg>=80':>8} {'p50 s':>6} {'p90 s':>6} {'maxtok':>7} {'think':>6}")
for path in sorted(glob.glob(os.path.join(d, "results-*.jsonl"))):
    rows = [json.loads(line) for line in open(path)]
    if not rows:
        continue

    def frac(pred, base):
        b = [r for r in rows if base(r)]
        return f"{sum(pred(r) for r in b)}/{len(b)}"

    gen = sorted(r["ms"] for r in rows if r["rail"] in ("model", "context"))
    pct = lambda p: gen[min(len(gen) - 1, int(len(gen) * p))] / 1000 if gen else 0   # noqa: E731
    print(f"{os.path.basename(path)[8:-6]:28} "
          f"{frac(lambda r: r['pass'], lambda r: True):>7} "
          f"{frac(lambda r: r['pass'], lambda r: r['cat'] == 'rail'):>7} "
          f"{frac(lambda r: r['pass'], lambda r: r['cat'] == 'private'):>8} "
          f"{frac(lambda r: r['checks'].get('tier_route', True) and r['checks'].get('tier_text', True), lambda r: 'tier_route' in r['checks']):>6} "
          f"{frac(lambda r: r['checks'].get('faithful', True), lambda r: 'faithful' in r['checks']):>7} "
          f"{frac(lambda r: r['score'] >= 80, lambda r: r['rail'] in ('model', 'context')):>8} "
          f"{pct(.5):6.1f} {pct(.9):6.1f} "
          f"{max(r['prompt_tokens'] for r in rows):7} {max(r['thinking_chars'] for r in rows):6}")
