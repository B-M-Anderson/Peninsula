// Central site configuration — edit values here, everything reads from this file.

export const SITE_URL = "https://www.bennettanderson.com";
export const SITE_NAME = "Bennett M. Anderson";
export const SITE_TAGLINE = "Biomedical engineering · Iowa State University";
// Default <meta name="description"> and social-card text.
export const SITE_DESCRIPTION =
  "Biomedical engineering student at Iowa State University. Projects in lab-equipment repair, local AI, hardware and the web, plus a resume and how to get in touch.";
// Hero fact line — who, what, where, when — read at a glance above the blurb.
// The band above already says the degree and the school, so this carries the rest.
export const HERO_FACTS = ["Senior, graduating May 2027", "Minor in pharmacology", "Ames, IA"];

// The two lines a recruiter or collaborator wants first.
export const CURRENTLY = {
  now: "Finishing senior year at Iowa State — reading papers, building small projects and learning new tools after wrapping an undergraduate research role in E. coli genetics.",
  lookingFor: "Graduate school in pharmaceutical development, and open to industry. No location preference.",
};

// The homepage introduction.
export const BLURB =
  "I'm working to improve my skills, computational and otherwise, to become the best engineer and scientist I can in the pursuit of better global health.";

export const SUBSTACK_URL: string | null = "https://bennettmanderson.substack.com";

// Access code for the hidden /vault page (client-side easter egg, not real
// security — anyone reading the bundle can find it, which is part of the fun).
export const VAULT_CODE = "helix";

// Keystroke sequences typed anywhere on the site that summon the vault gate.
// The homepage says "type her name", so both the name and the nickname work.
export const VAULT_TRIGGERS = ["penny", "penrose"];

// Concierge (local desktop AI) — displayed on /ask. Update when the desktop
// node comes online for real.
export const CONCIERGE = {
  plannedRuntime: "Ollama",
  plannedModel: "not yet provisioned",
  host: "desktop node · home network · outbound-only relay",
};

// The /ask fast-lane passphrase is NOT here: it lives in the
// CONCIERGE_PRIORITY_CODE environment variable and is checked on the server,
// so it never ships in the page. Typing it into the ask box unlocks priority.

// Channels the "Recent posts" homepage section links out to. Set to null to
// hide that platform's link; entries themselves live in app/data/posts.ts.
export const YOUTUBE_CHANNEL_ID = "UCY7H6pvaCxxdUModczjw_ew";
export const YOUTUBE_URL: string | null = `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`;
export const X_HANDLE = "Bennett4Now";
export const X_URL: string | null = `https://x.com/${X_HANDLE}`;

export const GITHUB_USER = "B-M-Anderson";
export const GITHUB_URL = `https://github.com/${GITHUB_USER}`;
export const REPO_URL = `${GITHUB_URL}/Peninsula`;
export const LINKEDIN_URL = "https://www.linkedin.com/in/bennett-m-anderson/";
export const RESUME_PATH = "/ResumeBennettAnderson.pdf";
export const RESUME_META = { pages: 1, updated: "August 2026" };
export const CONTACT_EMAIL = "bennetta32.30@gmail.com";
/** mailto: with a subject, so a blank compose window never lands in front of someone. */
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Hello from bennettanderson.com")}`;
export const CONTACT_PHONE = "(815) 821-9604";
// Darkroom upload ceiling. Vercel functions reject request bodies over 4.5 MB
// before a route ever runs, so the advertised limit has to sit under that; the
// page checks it before sending and the route checks it again.
export const DARKROOM_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Dial-able form of CONTACT_PHONE for tel: links. */
export const CONTACT_PHONE_TEL = `+1${CONTACT_PHONE.replace(/\D/g, "")}`;
