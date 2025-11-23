"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react"; // make sure lucide-react is installed

type Project = {
  title: string;
  description: string;
  githubUrl?: string;
  date: string;
};

const projects: Project[] = [
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
  },
  // Add more projects here
];

export default function ProjectsPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpanded(expanded === idx ? null : idx);
  };

  return (
    <div className="max-w-4xl mx-auto py-18 px-6 space-y-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Projects & Publications
      </h1>

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
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {project.date}
              </span>
            </div>

            <ChevronDown
              className={`h-6 w-6 text-gray-500 transition-transform duration-200 ${
                expanded === idx ? "rotate-180" : ""
              }`}
            />
          </button>

          {expanded === idx && (
            <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <p className="opacity-80 whitespace-pre-line">{project.description}</p>

              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-blue-600 hover:underline"
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
