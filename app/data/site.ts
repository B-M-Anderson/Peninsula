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

export const GITHUB_USER = "B-M-Anderson";
export const GITHUB_URL = "https://github.com/B-M-Anderson";
export const LINKEDIN_URL = "https://www.linkedin.com/in/bennett-m-anderson/";
export const RESUME_PATH = "/ResumeBennettAnderson.pdf";
export const CONTACT_EMAIL = "bennetta32.30@gmail.com";
export const CONTACT_PHONE = "(815) 821-9604";
