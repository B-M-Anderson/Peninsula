"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Project = {
  title: string;
  description: string;
  githubUrl?: string;
  date: string;
  skills: string[];
};

const projects: Project[] = [
  {
    title: "Bennett-Anderson.com",
    description:`You're looking at this one! 

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
  "Vercel"
],
  },

  {
    title: "MP3 Merger / Cross-Fader",
    description:`A Python tool for blending multiple MP3 files together with smooth crossfades, dynamic EQ adjustments, and volume visualization. 

Section update and video demo coming soon!`,
    githubUrl: "https://github.com/B-M-Anderson/mp3-Playlist-Crossfader",
    date: "November 24, 2025",
skills: [
  "Python",
  "Audio Processing",
  "Git/GitHub",
  "pydub",
  "matplotlib"
],
  },
  // Add more projects here
];

export default function ProjectsPage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const checkDark = () => setDark(document.documentElement.classList.contains("dark"));

    checkDark(); // initial check

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const toggleExpand = (idx: number) => {
    setExpanded(expanded === idx ? null : idx);
  };

  // Badge colors
  const badgeBg = dark ? "bg-purple-800" : "bg-purple-200";
  const badgeBorder = dark ? "border-purple-600" : "border-purple-300";
  const badgeText = "text-current"; // inherits main text color (black/light, white/dark)

  return (
    <div className="max-w-4xl mx-auto py-18 px-6 space-y-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Projects & Publications</h1>

      {projects.map((project, idx) => (
        <div
          key={idx}
          className="relative border rounded-lg shadow dark:border-gray-700"
        >
          <button
            onClick={() => toggleExpand(idx)}
            className="w-full flex items-center justify-between p-6 focus:outline-none"
          >
            <div className="flex flex-col text-left">
              <h2 className="text-xl font-semibold">{project.title}</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{project.date}</span>
            </div>

            <ChevronDown
              className={`h-6 w-6 text-gray-500 transition-transform duration-200 ${
                expanded === idx ? "rotate-180" : ""
              }`}
            />
          </button>

          {expanded === idx && (
            <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <p className="opacity-90 whitespace-pre-line mb-4">{project.description}</p>

              {/* Highlighted Skills above GitHub link */}
              <div className="mb-4">
                <h3 className="text-sm pt-4 font-semibold text-current mb-2">Highlighted Skills:</h3>
                <div className="flex flex-wrap gap-3">
                  {project.skills.map((skill, i) => (
                    <span
                      key={i}
                      className={`px-5 py-2 text-sm font-medium rounded-full border ${badgeBg} ${badgeBorder} ${badgeText}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pt-3 inline-block text-blue-600 hover:underline"
                >
                  View on GitHub
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
