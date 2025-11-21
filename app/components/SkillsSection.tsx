"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SkillsSection() {
  const categories = [
    {
      name: "Computational Tools",
      skills: [
        "MATLAB",
        "Python",
        "TypeScript",
        "React / Next.js",
        "Node.js",
        "Tailwind CSS",       
      ],
    },
    {
      name: "Molecular Biology & CRISPR",
      skills: [
        "PRISM",
        "CRISPR Gene Editing Concepts",
        "gRNA Design",
        "Sequence Alignment",
        "Bioinformatics Basics",
      ],
    },
    {
      name: "Data & Analysis",
      skills: [
        "Data Analysis", 
        "Visualization", 
        "Statistics", 
        "Experiment Design"
    ],
    },
  ];

  const [openCategory, setOpenCategory] = useState<number | null>(0);

  const toggle = (index: number) =>
    setOpenCategory(openCategory === index ? null : index);

  return (
    <section className="p-8">
      <h2 className="text-3xl font-bold mb-6">Skills 🛠️</h2>

      <div className="space-y-4">
        {categories.map((cat, index) => (
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
                  {cat.skills.map((skill) => (
                    <div
                      key={skill}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-800 
                                 text-gray-900 dark:text-gray-100 
                                 rounded-lg shadow-sm"
                    >
                      {skill}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
