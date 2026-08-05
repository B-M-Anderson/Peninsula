#!/usr/bin/env bash
# One-shot concierge health check. Run on the DESKTOP (needs .env.concierge).
# Proves the node + Upstash relay work end-to-end, independent of Vercel.
set -u
cd "$(dirname "$0")"
set -a; . ./.env.concierge 2>/dev/null; set +a
H="Authorization: Bearer ${UPSTASH_REDIS_REST_TOKEN:-}"; U="${UPSTASH_REDIS_REST_URL:-}"

echo "service : $(systemctl --user is-active concierge-poller 2>/dev/null)"
echo "ollama  : $(systemctl is-active ollama 2>/dev/null)"
[ -z "$U" ] && { echo "NO .env.concierge (are you on the desktop?)"; exit 2; }
echo "heartbeat: $(curl -s "$U/get/concierge:heartbeat" -H "$H")"

JID="verify-$(date +%s)"
curl -s "$U/lpush/concierge:jobs" -H "$H" -H 'Content-Type: text/plain' \
  --data-binary "{\"id\":\"$JID\",\"question\":\"what does bennett study?\"}" >/dev/null
for i in $(seq 1 45); do
  R=$(curl -s "$U/get/concierge:answer:$JID" -H "$H")
  if [ "$R" != '{"result":null}' ]; then
    echo "RELAY ROUND-TRIP OK (${i}s): $R"
    curl -s "$U/del/concierge:answer:$JID" -H "$H" >/dev/null
    exit 0
  fi
  sleep 1
done
echo "RELAY ROUND-TRIP FAILED — node not answering; check: journalctl --user -u concierge-poller -n 40"
exit 1
