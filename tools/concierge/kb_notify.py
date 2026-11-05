#!/usr/bin/env python3
"""kb_notify.py WORK_DIR HEADLINE: report a refresh.

Always appends to ~/concierge-kb/build/refresh-log.md. Also sends to Discord or
Gmail when ~/.config/concierge/notify.env (chmod 600) sets DISCORD_WEBHOOK_URL,
or GMAIL_USER and GMAIL_APP_PASSWORD. A failed send never fails the refresh.
"""
import json
import os
import smtplib
import ssl
import sys
import time
import urllib.request
from email.message import EmailMessage

ENV = os.path.expanduser("~/.config/concierge/notify.env")
LOG = os.path.expanduser("~/concierge-kb/build/refresh-log.md")
DISCORD_LIMIT = 1900


def load_env():
    env = {}
    if os.path.exists(ENV):
        if os.stat(ENV).st_mode & 0o077:
            print(f"{ENV} is readable by others; ignoring it", file=sys.stderr)
            return env
        for line in open(ENV):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def main():
    work, headline = sys.argv[1], sys.argv[2]
    changes = ""
    path = os.path.join(work, "changes.md")
    if os.path.exists(path):
        changes = open(path).read().strip()
    body = f"Concierge KB refresh, {time.strftime('%Y-%m-%d %H:%M')}\n{headline}\n\n{changes}".strip()
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    with open(LOG, "a") as f:
        f.write(f"\n---\n{body}\n")
    print(body)
    env = load_env()
    try:
        if env.get("DISCORD_WEBHOOK_URL"):
            text = body if len(body) <= DISCORD_LIMIT else body[:DISCORD_LIMIT] + "\n(truncated; see refresh-log.md)"
            req = urllib.request.Request(env["DISCORD_WEBHOOK_URL"], data=json.dumps({"content": text}).encode(),
                                         headers={"Content-Type": "application/json", "User-Agent": "concierge-refresh"})
            urllib.request.urlopen(req, timeout=20).read()
        elif env.get("GMAIL_USER") and env.get("GMAIL_APP_PASSWORD"):
            msg = EmailMessage()
            msg["Subject"], msg["From"], msg["To"] = "Concierge KB refresh", env["GMAIL_USER"], env["GMAIL_USER"]
            msg.set_content(body)
            with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ssl.create_default_context(), timeout=30) as s:
                s.login(env["GMAIL_USER"], env["GMAIL_APP_PASSWORD"])
                s.send_message(msg)
    except Exception as e:                                    # noqa: BLE001
        with open(LOG, "a") as f:
            f.write(f"\n(notification failed: {e.__class__.__name__})\n")


if __name__ == "__main__":
    main()
