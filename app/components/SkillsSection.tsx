"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SkillsSection() {
  const [mounted, setMounted] = useState(false);
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Function to check if <html> has dark class
    const checkDark = () => setDark(document.documentElement.classList.contains("dark"));

    // Initial check
    checkDark();

    // Observe class changes on <html> for dark/light mode updates
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const categories = [
    {
      name: "Computational Tools",
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
      name: "MicroBiology",
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
      name: "Data & Analysis",
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
      name: "Soft Skills",
      skills: [
        { name: "Professional Communication", strong: true },
        { name: "Technical Presentation", strong: true },
        { name: "Team Collaboration & Management", strong: true },
        { name: "Customer Service & Relations", strong: false },
      ],
    },
  ];

  const strongColor = dark
    ? "bg-green-800 text-green-100"
    : "bg-green-100 text-green-900";
  const normalColor = dark
    ? "bg-gray-800 text-gray-100"
    : "bg-gray-200 text-gray-900";

  const toggle = (index: number) =>
    setOpenCategory(openCategory === index ? null : index);

  return (
    <section className="p-8">
      <h2 className="text-3xl font-bold mb-6">Skills 🛠️</h2>

      <div className="space-y-4">
        {categories.map((cat, index) => {
          const sortedSkills = [...cat.skills].sort(
            (a, b) => Number(b.strong) - Number(a.strong)
          );

          return (
            <div
              key={cat.name}
              className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Category button */}
              <button
                onClick={() => toggle(index)}
                className={`w-full flex justify-between items-center p-4 text-left transition-colors ${
                  dark
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <span className={`font-semibold text-lg`}>
                  {cat.name}
                </span>

                {/* Arrow */}
                <span className="text-xl">{mounted && (openCategory === index ? "▲" : "▼")}</span>
              </button>

              {/* Dropdown */}
              <AnimatePresence initial={false}>
                {openCategory === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={dark ? "p-4 space-y-2 bg-gray-900" : "p-4 space-y-2 bg-gray-50"}
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
