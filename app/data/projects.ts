export type Project = {
  title: string;
  description: string;
  /** One line shown on the collapsed row. Defaults to the description's first sentence. */
  summary?: string;
  githubUrl?: string;
  date: string;
  skills: string[];
  importantSkills?: string[];
  media?: "photo" | "video" | "both" | "none";
  aiUsage?: number;
  completion?: number;
  thumbnailUrl?: string;
  imageUrl?: string;
  /** width / height of imageUrl, so the panel reserves the right space before it loads. */
  imageAspect?: number;
  wip?: boolean;
  terminated?: boolean;
  completed?: boolean;
  ongoing?: boolean;
  shelved?: boolean;
  /** YouTube link for the project — embedded on the project's detail panel. */
  videoUrl?: string;
  /** Kept out of the live site. Edit it here, publish it when it's ready. */
  draft?: boolean;
};

export const projects: Project[] = [
  {
    title: "Centrifuge Repair",
    description: `A dead centrifuge, fully disassembled on a folding table and assessed for issues. After a few YouTube videos, multimeter testing, capacitor replacements, soldering, and some blind luck, it's back to life! 

This great video was a lot of help: 
https://youtu.be/f-lBA9Kq3T4?si=uDx0hGnT-V_UUTgt

~(Thumbnail illustration by DataBase Center for Life Science (DBCLS) — CC BY 4.0, creativecommons.org/licenses/by/4.0)`,
    date: "August 21, 2026",
    skills: ["Electronics", "Repair", "Troubleshooting", "Lab Equipment", "Soldering", "Eppendorf 5415D"],
    importantSkills: ["Electronics", "Repair", "Troubleshooting"],
    media: "video",
    aiUsage: 0,
    completion: 100,
    thumbnailUrl: "/thumbnails/centrifuge.png",
    videoUrl: "https://www.youtube.com/watch?v=7f_vMT50zss",
    wip: false,
    ongoing: false,
    terminated: false,
    completed: true,
    shelved: false,
  },

  {
    title: "PiTV",
    description: `An old Sony CRT television, a Raspberry Pi, and a phone-friendly web remote is all that's needed to stream anything you want to a classic (heavy) piece of machinery.

**The hardware.** The Pi outputs HDMI, which an active converter turns into composite video, feeding into the CRT's RCA inputs. Getting there meant opening the set up, splicing some cables, and soldering... then resoldering connections between all 3 elements while maintaining accessibility. 

**The remote** is a web page served off the Pi and opened on any typical device. Making it easy to control without an app, remote, or anything, which although potentially leaves some security gaps, if someone wants to change the channel that badly I'll let it slide. It shows what's playing with a scrub bar and running time, transport controls, a loop toggle, a volume slider, and a library of everything on the Pi. Paste any video URL and it plays that instead.

When not in use, or when using late, there's a sleep timer that tells the Pi when to stop the stream. It's the single feature a CRT in a bedroom actually needs, and it's also something most smart TVs don't make easy. All moments of stoppage, whether pausing, restarting, or sleeping saves the current status so you can kick right back off where you left it when it's booted back up.

Finished and in use playing Wii, watching The Matrix, and eventually for use in an art installation (it was technically a commissioned project).`,
    date: "June 20, 2026",
    skills: ["Raspberry Pi Zero 2 W", "Linux", "Web Development", "Hardware", "Electronics", "Home Automation", "UI Design"],
    importantSkills: ["Raspberry Pi", "Hardware", "Web Development"],
    media: "video",
    aiUsage: 30,
    completion: 100,
    thumbnailUrl: "/thumbnails/pitv.png",
    videoUrl: "https://www.youtube.com/watch?v=P2h4f3itk0k",
    wip: false,
    ongoing: false,
    terminated: false,
    completed: true,
    shelved: false,
  },

  {
    title: "Local-LLM Site Concierge",
    description: `The **Ask** page on this site, answered by a small language model running on my own desktop at home. No cloud inference, no API key, no data centre.

**The plumbing is the hard part, not the model.** My desktop sits behind NAT with nothing open to the internet, and I wasn't willing to forward a port to run a toy. So the connection only ever runs outward: the Vercel route pushes a job onto an Upstash Redis queue, the desktop long-polls that queue over HTTPS, runs the question against a local Ollama model, and writes the answer back under the job's id. Nothing ever reaches in. The desktop also publishes a heartbeat with a short TTL — if it goes stale the site knows the node is down and says so, in plain language, with links, instead of hanging.

**Making a public-facing model behave** is most of the remaining work, and it's layered rather than clever:
- A **regex pre-filter** refuses instruction-extraction and override attempts before the model is ever called, so the cheapest attacks cost nothing to defend.
- A **hardened system prompt** answers about me only from a single grounding document, in third person, and is told to treat missing sections as "I don't know" rather than fill them in.
- **Deterministic rails** catch two specific failure modes a prompt alone won't reliably prevent: impersonating me, and making commitments on my behalf — replying to an offer, agreeing to a date, accepting anything. Those are intercepted rather than negotiated with.
- **Everything fails closed.** A model error, a relay error, a malformed job — all of them produce no answer, which surfaces as the honest offline message. A wrong answer about a real person is worse than no answer.

**Speed, without pretending.** A 3B model on four CPU cores takes 10–20 seconds a question, and no amount of tuning changes that. What does change it is not running the model at all: the box is idle almost all the time, so an idle worker precomputes answers to likely questions, generates several candidates, and scores them against a formal-register rubric — contractions, filler, fourth-wall leaks, sentence count — keeping only the best. Cache matching is normalised-exact on purpose. No embeddings, no fuzzy similarity: a near-miss would serve a confidently incorrect answer about a real person, which is far worse than being slow. The cache is keyed by a fingerprint of the system prompt plus the grounding doc, so editing either retires every stale entry automatically.

**What the visitor sees.** The \`/ask\` page shows which model is loaded, the machine it's running on, your position in the queue, and whether the desktop is even awake. There's a passphrase fast-lane that jumps the queue for people I've given it to. It's deliberately un-magical: the point is that a small model on a normal computer in a house can do this, and you can watch it happen.

**Built with** Next.js API routes and Upstash Redis on the site side; a single-file Python poller, Ollama and systemd on the desktop side.

It must be noted with such a machine running it hard indefinitely is a lot, so it often shuts down and auto-reboot systems fail. I'm working to improve this, which may include switching from Linux Mint, which I am now comfortable enough to do, to something with even less overhead. A headless distro may be in order for such a project.`,
    githubUrl: "https://github.com/B-M-Anderson/peninsula",
    date: "August 11, 2026",
    skills: [
      "Local LLMs",
      "Ollama",
      "System Design",
      "Security Design",
      "Prompt Engineering",
      "Next.js",
      "API Routes",
      "Redis",
      "Python",
      "systemd",
    ],
    importantSkills: ["Local LLMs", "System Design", "Security Design"],
    media: "none",
    aiUsage: 80,
    completion: 82,
    thumbnailUrl: "/thumbnails/concierge.png",
    wip: true,
    ongoing: false,
    terminated: false,
    completed: true,
    shelved: false,
  },

  {
    title: "Lit Explorer",
    description: `A local-first desktop app for reading into gene therapy and drug development, with an on-device AI assistant. Built for a reader who is technically strong but newer to biology — me.

**The problem it solves.** Reading unfamiliar literature is a vocabulary problem before it is a comprehension problem. You hit a term, you leave the paper to look it up, you lose the thread, and twenty minutes later you are six tabs deep in something unrelated. Lit Explorer keeps everything in one window so the paper never leaves the screen.

**What's in it**
- **New Releases** — a live feed from bioRxiv, medRxiv and Europe PMC filtered to my topics, so there's always something current to read.
- **Explore** — filter a hand-curated corpus of 39 resources by tier and tag, or search all of Europe PMC live.
- **Reader** — open-access full text where it exists, metadata where it doesn't, plus imported PDFs. Highlight any term and press \`Ctrl+L\` to have it explained, or \`Ctrl+H\` for its history — how the concept developed, not just what it means. Answers are grounded in the article you're actually reading.
- **Library** — foldered bookmarks, a persistent glossary built from every term you've looked up (exportable as Markdown), and recently-read tracking.
- **Curriculum** — an interactive gene-therapy roadmap whose milestones link straight into the corpus, so "learn this field" becomes an ordered path rather than a pile of papers.
- **Related work** — references, citing articles and similar papers in the reader's side panel.
- **Semantic recommendations** — local embeddings rank the corpus against what I've bookmarked and looked up, falling back to tag-matching when offline.
- **System-wide lookup** — highlight text anywhere on the desktop and a global hotkey sends it to the app.

**Focus Reader**, the part I'm most pleased with, is a different way of reading entirely. The paper is shown one word at a time in a fixed position so your eyes never move — RSVP — narrated by a local voice, with the word display driven by the audio's own per-word timings, so the flashing word *is* the word being spoken. The figure panel swaps to whichever figure or table the current sentence just mentioned. A rolling few seconds of microphone is always being transcribed, so you can say "stop", "faster", "go back", "next figure" without touching anything; say the activation phrase and you can ask a question out loud, get an answer grounded in the sentence you were on, read aloud, and then reading resumes where it left off.

**Everything runs on the machine.** Ollama serves the chat model and the embedding model; piper and faster-whisper handle speech on the CPU. No API keys, no accounts, and nothing about what I read leaves the laptop — which matters more than it sounds when the reading list itself is the sensitive part.

**Built with** Electron and React on electron-vite, with a main process split into modules for the model client, the live sources, PDF handling, recommendations, the voice pipeline and a plain JSON store — no database, because the data is small and a file I can read is worth more than a schema.
 
- demo video coming soon`,
    githubUrl: "https://github.com/B-M-Anderson/lit-explorer",
    date: "August 17, 2026",
    skills: [
      "Electron",
      "React",
      "TypeScript",
      "Ollama",
      "Local LLMs",
      "Vite",
      "Europe PMC API",
      "Speech Recognition",
      "UI Design",
    ],
    importantSkills: ["Electron", "React", "Local LLMs", "UI Design"],
    media: "none",
    aiUsage: 75,
    completion: 80,
    thumbnailUrl: "/thumbnails/lit-explorer.png",
    wip: true,
    ongoing: false,
    terminated: false,
    completed: true,
    shelved: false,
  },

  {
    title: "Video Production Workflow",
    description: `Two Linux desktop apps that take a video from "it's on my phone" to "it's in the recording". Built because the individual pieces all exist and none of them fit together. All I have to do is choose what clips I want moved, put them in order of when and how I want to talk about them, and begin presenting in OBS to be later trimmed down and edited in Kdenlive (I use EndeavorOS)

**iPhone Import** browses the camera roll over USB and copies what I select into a project folder. That sounds trivial and isn't: on this machine ifuse silently returns corrupt data for large files. The same 183 MB clip read three times gave three different checksums, at identical file size, with damage starting on a 64 KiB boundary and no USB error logged anywhere. Roughly a third of 4 MB chunks come back wrong on any given read — which is where a long-standing "some of my imports are broken" problem turned out to come from.

The fix is a verified copy: read each chunk, drop it from the page cache, read it again, and only accept it when two reads agree. Corruption is random per read, so agreement is strong evidence of correctness — and copies built this way are reproducible where plain copies never are. Every file is then decoded end to end before it counts as imported, and anything that fails is deleted and reported rather than left on disk looking fine.

**Video Deck Studio** is the other half. Order the clips by dragging; mark in and out points that apply instantly, because they're stored as marks rather than re-encoded, so trimming ruthlessly costs nothing; hide what you've skipped; and present the result into OBS.

Its most useful feature is **pairs**: two clips joined into one item, composited into a single frame — a screen recording of a demo beside the phone video of the same thing. Pairs open a two-track timeline where you drag one clip against the other to line them up and drag either end of either clip to trim it. Both sides are scaled to *fit* their half of a 1920×1080 frame and padded, so neither can ever crop the other, and the layout picks itself: two portrait clips sit side by side, two landscape ones stack.

**The preview is a real render.** The obvious approach — one live filter graph in the player — was built first and then measured against an actual render, and the two disagreed: mpv drives its filter graph from its own playback position, so trims there don't mean what they mean to ffmpeg. Trims would have previewed as one thing and exported as another. Instead the editor renders a small 360p window around the playhead through the identical code path as the final export, and the two were then verified frame by frame. Presenting plays a full-resolution render, never the proxy.

**Working with Wayland rather than against it.** Window embedding doesn't exist, and OBS binds its capture to a specific window — so the player is one long-lived window that OBS is pointed at once, and everything else is driven over its JSON IPC socket.

**Built with** Python and PyQt6, driving mpv and ffmpeg, on top of libimobiledevice for the phone.

~(Written to make my own videos; still growing as I hit new limitations.)`,
    githubUrl: "https://github.com/B-M-Anderson/video-workflow",
    date: "August 29, 2026",
    skills: [
      "Python",
      "PyQt6",
      "FFmpeg",
      "mpv IPC",
      "OBS Studio",
      "Linux",
      "Wayland",
      "libimobiledevice",
      "Video Processing",
      "UI Design",
    ],
    importantSkills: ["Python", "FFmpeg", "Video Processing", "UI Design"],
    media: "video",
    aiUsage: 90,
    completion: 80,
    thumbnailUrl: "/thumbnails/video-workflow.png",
    wip: true,
    ongoing: true,
    terminated: false,
    completed: false,
    shelved: false,
  },

  {
    title: "Bennett-Anderson.com",
    description: `**You're looking at this one!**

My personal website, designed for desktop and mobile use, built from scratch using **Next.js, TypeScript, and Tailwind CSS**.
Deployed & hosted by **Vercel** with a custom domain from Squarespace.
It features an **auto-detecting dark mode toggle**, a screen-size responsive navigation bar (that retracts) & homepage + other designs & animations, all intended to showcase my projects and skills.

Feel free to explore the code on my GitHub in my first public repository!
(It took some time to realize I didn't need to push every update to see how it works, and I still have to for mobile testing, so early commits are messy and abundant.)

Note: my learning of TypeScript website development sourced a lot of early information from LLM-AIs.
Many fixes & feature/content implementations were done by me, but original code and ongoing feature information is/was AI-assisted.
The more I do and improve this website, the more I continue to learn to do on my own!`,
    githubUrl: "https://github.com/B-M-Anderson/peninsula",
    date: "November 22, 2025",
    skills: [
      "Web Development",
      "UI Design",
      "Responsive Design",
      "Git/GitHub",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Framer Motion",
      "Vercel",
    ],
    importantSkills: ["TypeScript", "Web Development", "UI Design", "Responsive Design", "Git/GitHub"],
    media: "none",
    aiUsage: 55,
    completion: 85,
    thumbnailUrl: "/thumbnails/favicon.png",
    wip: false,
    ongoing: true,
    terminated: false,
    completed: false,
    shelved: false,
  },

  {
    title: "MP3 Merger / Cross-Fader",
    description: `A quick **Python** project for blending multiple MP3 files with **smooth crossfades**, **dynamic EQ tweaks**, and **audio visualization**. Made to give a **gift CD** some personal touch. Likely to be updated soon in the future!

~(Section update & video demo coming soon)`,
    githubUrl: "https://github.com/B-M-Anderson/mp3-Playlist-Crossfader",
    date: "November 24, 2025",
    skills: ["Python", "Audio Processing", "Git/GitHub", "pydub", "matplotlib"],
    importantSkills: ["Python", "Audio Processing"],
    media: "video",
    aiUsage: 60,
    completion: 65,
    thumbnailUrl: "/thumbnails/mp3.png",
    wip: false,
    ongoing: true,
    terminated: false,
    completed: false,
    shelved: false,
  },

  {
    title: "Custom Cat-Tree for Penny",
    description: `A **3D-modeled** (and soon hand made) cat tree designed specifically for Penny to enjoy next to my desk while I work.

Features **multiple levels**, **scratching posts**, and a **cozy hideaway** along with a bed *just* above desk-level to keep her entertained and comfortable.

Customer feedback: TBD
~photos and build process coming soon!`,
    githubUrl: "https://github.com/B-M-Anderson/Desk-Side-Cat-Tree",
    date: "November 25, 2025",
    skills: ["SolidWorks", "3D Modeling", "CAD", "Feline UX Design", "Hand-Manufacturing"],
    importantSkills: ["SolidWorks", "Feline UX Design"],
    media: "photo",
    aiUsage: 0,
    completion: 35,
    thumbnailUrl: "/thumbnails/CatTree.png",
    wip: false,
    ongoing: false,
    terminated: false,
    completed: false,
    shelved: true,
  },

  {
    title: "Resume Refresh",
    description: `Simple resume refresh using **LaTeX** to produce a **clean, modern design** that highlights my skills and experience effectively.

Project intended to demonstrate proficiency in LaTeX document creation and design.
Compiled in **XeLaTeX** using **AltaCV** document class, will be instated for all future applicable use-cases.

Visible on my mainpage as a downloadable PDF.`,
    githubUrl: "https://github.com/B-M-Anderson/resume-latex",
    date: "November 28, 2025",
    skills: ["LaTeX", "Attention to Detail", "Technical Comm.", "Document Design", "Information Structuring"],
    importantSkills: ["LaTeX", "Technical Comm."],
    media: "photo",
    aiUsage: 30,
    completion: 100,
    thumbnailUrl: "/thumbnails/resume.png",
    imageUrl: "/Previews/BennettAndersonResume1.png",
    imageAspect: 1632 / 2112,
    wip: false,
    ongoing: false,
    terminated: false,
    completed: true,
    shelved: false,
  },
];

/** What the site renders. Drafts stay in the file but off the pages. */
export const publishedProjects: Project[] = projects.filter((p) => !p.draft);

export type ProjectStatus = "terminated" | "complete" | "ongoing" | "wip" | "shelved";

/**
 * The one badge a project shows. The status booleans above are independent,
 * so this resolves them in a fixed order — and an entry flagged `completed`
 * while its completion bar is still short reads as the working state it is,
 * not as done.
 */
export function statusOf(p: Project): ProjectStatus {
  if (p.terminated) return "terminated";
  const done = p.completion === undefined || p.completion >= 100;
  if (p.completed && done) return "complete";
  if (p.ongoing) return "ongoing";
  if (p.wip) return "wip";
  if (p.shelved) return "shelved";
  return "ongoing";
}

/** The one-line version shown on collapsed rows: the entry's own summary, or its first sentence. */
export function summaryOf(p: Project): string {
  if (p.summary) return p.summary;
  const line = p.description.split("\n").map((l) => l.trim()).find((l) => l && !l.startsWith("~")) ?? "";
  const plain = line.replace(/\*\*|`|\*/g, "");
  const first = plain.split(/(?<=[.!?])\s+/)[0] ?? plain;
  return first.length > 150 ? `${first.slice(0, 147).trimEnd()}…` : first;
}

/** The short ledger under headings: how much is here, how far along, how recently it moved. */
export function projectCounts() {
  const byStatus: Record<ProjectStatus, number> = { terminated: 0, complete: 0, ongoing: 0, wip: 0, shelved: 0 };
  let latest = 0;
  for (const p of publishedProjects) {
    byStatus[statusOf(p)] += 1;
    latest = Math.max(latest, new Date(p.date).getTime() || 0);
  }
  const latestLabel = latest
    ? new Date(latest).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  return { total: publishedProjects.length, byStatus, inProgress: byStatus.ongoing + byStatus.wip, latestLabel };
}

/** Projects that share the most skills with this one (Jaccard), newest first on ties. */
export function relatedProjects(p: Project, n = 3): Project[] {
  const bag = (x: Project) => new Set([...x.skills, ...(x.importantSkills ?? [])].map((s) => s.toLowerCase()));
  const mine = bag(p);
  return publishedProjects
    .filter((q) => q !== p)
    .map((q) => {
      const theirs = bag(q);
      const shared = [...mine].filter((s) => theirs.has(s)).length;
      const union = new Set([...mine, ...theirs]).size;
      return { q, score: union ? shared / union : 0 };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.q.date).getTime() - new Date(a.q.date).getTime())
    .slice(0, n)
    .map((r) => r.q);
}

/** URL-safe id for a project: the element id on /projects and its #hash deep link. */
export function projectSlug(p: Project): string {
  return p.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
