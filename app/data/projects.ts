export type Project = {
  title: string;
  description: string;
  githubUrl?: string;
  date: string;
  skills: string[];
  importantSkills?: string[];
  media?: "photo" | "video" | "both" | "none";
  aiUsage?: number;
  completion?: number;
  thumbnailUrl?: string;
  imageUrl?: string;
  wip?: boolean;
  terminated?: boolean;
  completed?: boolean;
  ongoing?: boolean;
  shelved?: boolean;
};

export const projects: Project[] = [
  {
    title: "Local-LLM Site Concierge",
    description: `An AI assistant for this site, answered by a small language model running locally on my desktop PC — no cloud inference.

Visitors will be able to ask questions about me, my projects, and my background; the site relays them through an outbound-only job queue to my machine, where a local model (Ollama) generates answers grounded in the same content already published here. If my desktop is offline, the site degrades gracefully to plain links.

Planned stack: Ollama serving a small quantized instruct model (3-8B) on the desktop GPU, an outbound-only job queue as the relay (Upstash Redis), and a single structured markdown doc about me stuffed into the system prompt for grounding. Live status (online/offline, model, host) is shown on the ask page.

Currently in the architecture/security-design phase: relay design, rate limiting, prompt-injection guardrails, and offline fallback are specced; the on-site status readout and chat shell are already live.`,
    date: "July 15, 2026",
    skills: [
      "Local LLMs",
      "Ollama",
      "System Design",
      "Next.js",
      "API Routes",
      "Security Design",
      "Queueing",
    ],
    importantSkills: ["Local LLMs", "System Design", "Security Design"],
    media: "none",
    aiUsage: 70,
    completion: 10,
    thumbnailUrl: "/thumbnails/default.png",
    wip: true,
    ongoing: false,
    terminated: false,
    completed: false,
    shelved: false,
  },

  {
    title: "Bennett-Anderson.com",
    description: `You're looking at this one!

My personal website, designed for desktop and mobile use, built from scratch using Next.js, TypeScript, and Tailwind CSS.
Deployed & hosted by Vercel with a custom domain from Squarespace.
It features an auto-detecting dark mode toggle, a screen-size responsive navigation bar (that retracts) & homepage + other designs & animations, all intended to showcase my projects and skills.

Feel free to explore the code on my GitHub in my first public repository!
(It took some time to realize I didn't need to push every update to see how it works, and I still have to for mobile testing, so early commits are messy and abundant.)

Note: my learning of textscript website development sourced a lot of early information from LLM-AIs.
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
    description: `A quick Python project for blending multiple MP3 files with smooth crossfades,
dynamic EQ tweaks, and audio visualization. Made to give a gift CD some personal touch. Likely to be updated soon in the future!.

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
    description: `A 3D-modeled (and soon hand made) cat tree designed specifically for Penny to enjoy next to my desk while I work.

Features multiple levels, scratching posts, and a cozy hideaway along with a bed *just* above desk-level to keep her entertained and comfortable.

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
    description: `Simple resume refresh using LaTeX to produce a clean, modern design that highlights my skills and experience effectively.

    Project intended to demonstate proficiency in LaTeX document creation and design.
Compiled in XeLaTeX using using AltaCV document class,
Will be instated for all future applicable use-cases.

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
    wip: false,
    ongoing: false,
    terminated: false,
    completed: true,
    shelved: false,
  },
];
