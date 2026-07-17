"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [openCategory, setOpenCategory] = useState<number | null>(null);

  const toggle = (index: number) =>
    setOpenCategory(openCategory === index ? null : index);

  return (
    <section>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="font-term text-2xl font-bold mb-6 text-bio-green dark:text-phos glow"
      >
        <span className="text-bio-dim dark:text-phos-dim">&gt;</span> skills --list 🛠️
      </motion.h2>

      <div className="space-y-4">
        {categories.map((cat, index) => {
          const sortedSkills = [...cat.skills].sort(
            (a, b) => Number(b.strong) - Number(a.strong)
          );

          return (
            <div key={cat.name} className="term-panel rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(index)}
                className="w-full flex justify-between items-center p-4 text-left transition-colors hover:bg-bio-surface dark:hover:bg-abyss-surface"
              >
                <span className="font-term font-semibold text-base">
                  <span className="opacity-50">./</span>{cat.name}
                </span>
                <span className="font-term text-sm opacity-70">
                  {openCategory === index ? "[-]" : "[+]"}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {openCategory === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="p-4 space-y-2 bg-bio-surface/50 dark:bg-abyss-surface/50"
                  >
                    {sortedSkills.map((skill) => (
                      <div
                        key={skill.name}
                        className={`px-4 py-2 rounded-lg text-sm border ${
                          skill.strong
                            ? "border-bio-green/40 text-bio-green bg-bio-green/10 dark:border-phos/40 dark:text-phos-bright dark:bg-phos/10 font-medium"
                            : "border-bio-line dark:border-grid-line opacity-80"
                        }`}
                      >
                        {skill.strong && <span className="font-term mr-2">▸</span>}
                        {skill.name}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
