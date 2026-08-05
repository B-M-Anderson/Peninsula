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
    ],
  },
  {
    name: "microbiology",
    skills: [
      { name: "Bacterial experimental techniques", strong: true },
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
];

export default function SkillsSection() {
  const items: AccordionItem[] = categories.map((cat) => {
    const sorted = [...cat.skills].sort((a, b) => Number(b.strong) - Number(a.strong));
    return {
      title: (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-body)" }}>
          {cat.name}
        </span>
      ),
      meta: String(cat.skills.length),
      content: (
        <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
          {sorted.map((s) => (
            <Chip key={s.name} emphasis={s.strong ? "strong" : "normal"}>
              {s.name}
            </Chip>
          ))}
        </div>
      ),
    };
  });

  return <Accordion items={items} defaultOpen={0} />;
}
