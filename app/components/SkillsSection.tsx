"use client";

import { Accordion, Chip, type AccordionItem } from "./ui";

const categories = [
  {
    name: "computational-tools",
    skills: [
      { name: "MATLAB", strong: true },
      { name: "SolidWorks", strong: true },
      { name: "Git & GitHub", strong: false },
      { name: "TypeScript", strong: false },
      { name: "React / Next.js", strong: false },
      { name: "Tailwind CSS", strong: false },
      { name: "Python", strong: true },
      { name: "Node.js", strong: false },
      { name: "Linux", strong: false },
      { name: "Electron", strong: false },
      { name: "PyQt6", strong: false },
      { name: "Vite", strong: false },
      { name: "Redis", strong: false },
      { name: "systemd", strong: false },
      { name: "Vercel", strong: false },
      { name: "Framer Motion", strong: false },
      { name: "Wayland", strong: false },
      { name: "System Design", strong: false },
      { name: "Security Design", strong: false },
      { name: "REST / API Routes", strong: false },
    ],
  },
  {
    name: "microbiology",
    skills: [
      { name: "Bacterial Experimental Techniques", strong: true },
      { name: "Cloning & Transformation", strong: true },
      { name: "PCR & Gel Electrophoresis", strong: true },
      { name: "PRISM", strong: false },
      { name: "SnapGene", strong: true },
      { name: "PyMOL", strong: false },
      { name: "CRISPR Gene Editing Concepts", strong: false },
      { name: "gRNA Design", strong: false },
      { name: "Sequence Alignment", strong: false },
      { name: "Bioinformatics Basics", strong: true },
    ],
  },
  {
    name: "data-and-analysis",
    skills: [
      { name: "MATLAB", strong: true },
      { name: "PRISM", strong: true },
      { name: "Visualization", strong: false },
      { name: "Experimental Design", strong: true },
      { name: "LaTeX", strong: true },
      { name: "Statistics", strong: false },
      { name: "Python", strong: false },
      { name: "Excel / Microsoft Office Suite", strong: true },
    ],
  },
  {
    name: "soft-skills",
    skills: [
      { name: "Professional Communication", strong: true },
      { name: "Technical Presentation", strong: true },
      { name: "Team Collaboration & Management", strong: true },
      { name: "Customer Service & Relations", strong: false },
    ],
  },
  {
    name: "local-ai",
    skills: [
      { name: "Ollama", strong: false },
      { name: "Local LLM Deployment", strong: false },
      { name: "Prompt Engineering", strong: false },
      { name: "Prompt-Injection Hardening", strong: false },
      { name: "Embeddings & Semantic Search", strong: false },
      { name: "Local Speech (TTS / STT)", strong: false },
    ],
  },
  {
    name: "media-production",
    skills: [
      { name: "FFmpeg", strong: false },
      { name: "OBS Studio", strong: false },
      { name: "Kdenlive", strong: false },
      { name: "mpv", strong: false },
      { name: "Video Processing", strong: false },
    ],
  },
  {
    name: "hardware-and-repair",
    skills: [
      { name: "Raspberry Pi", strong: false },
      { name: "Electronics", strong: false },
      { name: "Soldering", strong: false },
      { name: "Diagnostic Troubleshooting", strong: false },
      { name: "Lab Equipment Repair", strong: false },
      { name: "3D Modeling", strong: false },
    ],
  },
];

export default function SkillsSection() {
  const items: AccordionItem[] = categories.map((cat) => {
    const sorted = [...cat.skills].sort((a, b) => Number(b.strong) - Number(a.strong));
    return {
      id: `skills-${cat.name}`,
      title: (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-body)" }}>
          {cat.name}
        </span>
      ),
      meta: String(cat.skills.length),
      content: (
        <ul aria-label={`${cat.name} skills`} style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", listStyle: "none", margin: 0, padding: 0 }}>
          {sorted.map((s) => (
            <li key={s.name}>
              <Chip emphasis={s.strong ? "strong" : "normal"}>{s.name}</Chip>
            </li>
          ))}
        </ul>
      ),
    };
  });

  return <Accordion items={items} defaultOpen={items[0]?.id} />;
}
