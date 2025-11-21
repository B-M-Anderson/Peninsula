"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SkillsSection() {
  const categories = [
    {
      name: "Computational Tools",
      skills: [
        { name: "MATLAB", strong: true },
        { name: "TypeScript", strong: false },
        { name: "React / Next.js", strong: false },
        { name: "Tailwind CSS", strong: false },
        { name: "Python", strong: true },
        { name: "Node.js", strong: false },
      ],
    },
    {
      name: "MicroBiology",
      skills: [
        { name: "Bacterial experimental techniques", strong: true },
        { name: "Cloning & Transformation", strong: true },
        { name: "PCR & Gel Electrophoresis", strong: true },
        { name: "PRISM", strong: false },
        { name: "CRISPR Gene Editing Concepts", strong: false },
        { name: "gRNA Design", strong: false },
        { name: "Sequence Alignment", strong: false },
        { name: "Bioinformatics Basics", strong: true },
      ],
    },
    {
      name: "Data & Analysis",
      skills: [
        { name: "Data Analysis", strong: true },
        { name: "Visualization", strong: false },
        { name: "Experimental Design", strong: true },
        { name: "Statistics", strong: false },
      ],
    },
    {
      name: "Soft Skills",
      skills: [
        { name: "Professional Communication", strong: true },
        { name: "Technical Presentation", strong: true },
        { name: "Team Collaboration & Management", strong: true },
        { name: "Customer Service & Relations", strong: false },
      ],
    },
  ];

  // Colors
  const strongColor =
    "bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100";
  const normalColor =
    "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100";

  // Default open first category
  const [openCategory, setOpenCategory] = useState<number | null>(0);

  const toggle = (index: number) =>
    setOpenCategory(openCategory === index ? null : index);

  return (
    <section className="p-8">
      <h2 className="text-3xl font-bold mb-6">Skills 🛠️</h2>

      <div className="space-y-4">
        {categories.map((cat, index) => {
          // Auto-sort: strong → normal
          const sortedSkills = [...cat.skills].sort(
            (a, b) => Number(b.strong) - Number(a.strong)
          );

          return (
            <div
              key={cat.name}
              className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* CATEGORY HEADER */}
              <button
                onClick={() => toggle(index)}
                className="w-full flex justify-between items-center p-4 text-left
                           bg-gray-100 dark:bg-gray-800
                           hover:bg-gray-200 dark:hover:bg-gray-700
                           transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                  {cat.name}
                </span>
                <span className="text-xl">
                  {openCategory === index ? "▲" : "▼"}
                </span>
              </button>

              {/* DROPDOWN CONTENT */}
              <AnimatePresence initial={false}>
                {openCategory === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="p-4 space-y-2 bg-gray-50 dark:bg-gray-900"
                  >
                    {sortedSkills.map((skill) => (
                      <div
                        key={skill.name}
                        className={`px-4 py-2 rounded-lg shadow-sm ${
                          skill.strong ? strongColor : normalColor
                        }`}
                      >
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
