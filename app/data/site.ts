// Central site configuration — edit values here, everything reads from this file.

export const SUBSTACK_URL: string | null = "https://bennettmanderson.substack.com";

// Access code for the hidden /vault page (client-side easter egg, not real
// security — anyone reading the bundle can find it, which is part of the fun).
export const VAULT_CODE = "helix";

// Keystroke sequence typed anywhere on the site that summons the vault gate.
export const VAULT_TRIGGER = "penny";

// Concierge (local desktop AI) — displayed on /ask. Update when the desktop
// node comes online for real.
export const CONCIERGE = {
  plannedRuntime: "Ollama",
  plannedModel: "not yet provisioned",
  host: "desktop node · home network · outbound-only relay",
};

// Priority passphrase for the /ask concierge. Typing this in the ask box grants
// queue-priority (the question jumps ahead of everyone) and skips any request
// limits. Soft gate only — it's in the client bundle, so it's not real security;
// it's a "for now" fast lane for me + friends. Swap for a server-only secret later.
export const CONCIERGE_PRIORITY_CODE = "Penrose122";

// Channels the "Recent posts" homepage section links out to. Set to null to
// hide that platform's link; entries themselves live in app/data/posts.ts.
export const YOUTUBE_URL: string | null = "https://www.youtube.com/channel/UCY7H6pvaCxxdUModczjw_ew";
export const X_URL: string | null = "https://x.com/Bennett4Now";

export const GITHUB_USER = "B-M-Anderson";
export const GITHUB_URL = "https://github.com/B-M-Anderson";
export const LINKEDIN_URL = "https://www.linkedin.com/in/bennett-m-anderson/";
export const RESUME_PATH = "/ResumeBennettAnderson.pdf";
export const CONTACT_EMAIL = "bennetta32.30@gmail.com";
export const CONTACT_PHONE = "(815) 821-9604";
