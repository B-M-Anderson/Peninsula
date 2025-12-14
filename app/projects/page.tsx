"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Camera, Video } from "lucide-react";

type Project = {
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
  imageUrl?: "/Previews/BennettAndersonResume1.png";
  wip?: boolean;
  terminated?: boolean;
  completed?: boolean;
  ongoing?: boolean;
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
    terminated: true,
    completed: false,
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
  },
];

export default function ProjectsPage() {
  const [expanded, setExpanded] = useState<number[]>([]);
  const [dark, setDark] = useState(false);
  const [sortBy, setSortBy] = useState<"date-new" | "date-old" | "completion-high" | "completion-low">("date-new");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortedProjects, setSortedProjects] = useState<Project[]>(projects);

  useEffect(() => {
    const checkDark = () => setDark(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sorted = [...projects];
    switch (sortBy) {
      case "date-new":
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "date-old":
        sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "completion-high":
        sorted.sort((a, b) => (b.completion || 0) - (a.completion || 0));
        break;
      case "completion-low":
        sorted.sort((a, b) => (a.completion || 0) - (b.completion || 0));
        break;
    }
    setSortedProjects(sorted);
  }, [sortBy]);

  const toggleExpand = (idx: number) => {
    setExpanded((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  function ProgressBar({ value, label }: { value: number; label: string }) {
    const normalized = Math.max(0, Math.min(100, Math.round(value)));
    const [dark, setDark] = useState(false);
    const barRef = useRef<HTMLDivElement>(null);
    const [circleLeft, setCircleLeft] = useState("0%");

    useEffect(() => {
      const checkDark = () => setDark(document.documentElement.classList.contains("dark"));
      checkDark();
      const observer = new MutationObserver(checkDark);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      if (barRef.current) {
        const width = barRef.current.offsetWidth;
        const pos = (normalized / 100) * width;
        setCircleLeft(`${pos}px`);
      }
    }, [normalized, barRef.current]);

    const barGradient = label.toLowerCase().includes("ai")
      ? "linear-gradient(90deg, #16a34a 0%, #4ade80 50%, #86efac 100%)"
      : "linear-gradient(90deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%)";

    return (
      <div className="mt-4 relative w-full group">
        <div ref={barRef} className={`w-full h-2.5 rounded-full ${dark ? "bg-gray-700" : "bg-gray-300"}`}>
          <div className="h-full rounded-full" style={{ width: `${normalized}%`, background: barGradient }} />
        </div>
        <div
          className={`absolute w-3 h-3 rounded-full ${dark ? "bg-gray-600" : "bg-gray-200"}`}
          style={{ top: "15%", left: circleLeft, transform: "translate(-50%, -50%)" }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 dark:bg-gray-200 text-white dark:text-black text-xs px-2 py-1 rounded-md pointer-events-none">
            {normalized}%
          </div>
        </div>
        <div className="flex justify-between text-xs mt-1 opacity-70 px-1">
          <span>0%</span>
          <span>{label}</span>
          <span>100%</span>
        </div>
      </div>
    );
  }

  const renderMediaTag = (media?: Project["media"]) => {
    if (!media || media === "none") return null;
    const base = "flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border opacity-75 whitespace-nowrap";
    const style = `${base} ${dark ? "border-gray-600" : "border-gray-300"}`;

    if (media === "photo") return <span className={style}><Camera className="w-4 h-4" /> Photo Demo</span>;
    if (media === "video") return <span className={style}><Video className="w-4 h-4" /> Video Demo</span>;
    if (media === "both") return <span className={style}><Camera className="w-4 h-4" /> <Video className="w-4 h-4" /> Photo & Video</span>;
  };

  return (
    <div className="max-w-4xl mx-auto py-18 px-6 space-y-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Projects & Publications</h1>

      {/* Sort Dropdown */}
      <div className="flex justify-start mb-4 relative">
        <button
          onClick={() => setSortOpen((prev) => !prev)}
          className={`px-4 py-1 rounded-full text-sm flex items-center gap-2 focus:outline-none ${
            dark ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-700"
          }`}
        >
          Sort:{" "}
          <span className="font-semibold">
            {sortBy === "date-new"
              ? "Date: New → Old"
              : sortBy === "date-old"
              ? "Date: Old → New"
              : sortBy === "completion-high"
              ? "Completion: High → Low"
              : "Completion: Low → High"}
          </span>
        </button>

        {sortOpen && (
          <div
            className={`absolute left-0 mt-2 w-48 rounded-md shadow-lg z-10 border ${
              dark ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"
            }`}
          >
            {[
              { value: "date-new", label: "Date: New → Old" },
              { value: "date-old", label: "Date: Old → New" },
              { value: "completion-high", label: "Completion: High → Low" },
              { value: "completion-low", label: "Completion: Low → High" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSortBy(option.value as typeof sortBy);
                  setSortOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                  dark ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Project List */}
      {sortedProjects.map((project, idx) => {
        const isOpen = expanded.includes(idx);
        const sortedSkills = [...project.skills].sort((a, b) => {
          const important = project.importantSkills || [];
          if (important.includes(a) && !important.includes(b)) return -1;
          if (!important.includes(a) && important.includes(b)) return 1;
          return 0;
        });

        // Helper to render full-width status bars with tooltips
        const renderFullWidthStatus = (label: string, type: 'wip' | 'terminated' | 'completed' | 'ongoing') => {
            const bgClass =
                type === 'terminated' ? (dark ? "bg-red-400/75 text-white" : "bg-red-400/40 text-black") :
                type === 'completed' ? (dark ? "bg-green-400/75 text-white" : "bg-green-400/40 text-black") :
                type === 'ongoing' ? (dark ? "bg-blue-400/75 text-white" : "bg-blue-400/40 text-black") :
                (dark ? "bg-orange-400/75 text-white" : "bg-orange-400/40 text-black"); // wip

            let tooltipText = "";
            if (type === 'wip') tooltipText = "This project is not yet usable";
            if (type === 'terminated') tooltipText = "This project has been discontinued. The goal has been solved alternatively or is no longer relevant.";
            if (type === 'completed') tooltipText = "This project is working as intended and will not be receiving regular further updates.";
            if (type === 'ongoing') tooltipText = "This project is working, but will continue to receive updates and improvements.";

            return (
                <div className="group relative w-full text-center cursor-default">
                    <span className={`text-xs font-bold py-1 block rounded ${bgClass}`}>
                        {label}
                    </span>
                    <span className="absolute left-1/2 -translate-x-1/2 -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none w-max max-w-[250px] z-20 dark:bg-gray-200 dark:text-black">
                        {tooltipText}
                    </span>
                </div>
            );
        };

        return (
          <div key={idx} className="relative border rounded-lg shadow dark:border-gray-700">
            <button
              onClick={() => toggleExpand(idx)}
              className="w-full flex items-center justify-between p-6 focus:outline-none"
            >
              <div className="flex flex-col text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  <h2 className="text-xl font-semibold">{project.title}</h2>

                  {project.thumbnailUrl && (
                    <img
                      src={project.thumbnailUrl}
                      alt={`${project.title} thumbnail`}
                      className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded ml-0 sm:ml-2 mt-2 sm:mt-0"
                    />
                  )}

                  {project.media && (
                    <div className="mt-3 sm:mt-0 sm:ml-2">
                      {renderMediaTag(project.media)}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">{project.date}</span>
              </div>

              <ChevronDown
                className={`h-6 w-6 text-gray-500 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
                {project.imageUrl && (
                  <div className="w-full flex justify-center">
                    <img
                      src={project.imageUrl}
                      alt="Project Preview"
                      className="w-102 h-102 object-cover rounded-xl shadow-lg border dark:border-gray-700"
                    />
                  </div>
                )}

                {/* Status Bars - Full Width inside Dropdown */}
                {project.terminated && renderFullWidthStatus("Terminated", "terminated")}
                {project.completed && renderFullWidthStatus("Completed", "completed")}
                {project.ongoing && renderFullWidthStatus("Ongoing", "ongoing")}
                {project.wip && renderFullWidthStatus("WIP", "wip")}
                {/* End Status Bars */}

                <p className="opacity-90 whitespace-pre-line">{project.description}</p>

                <div>
                  <h3 className="text-sm pt-2 font-semibold mb-2">Skills:</h3>
                  <div className="flex flex-wrap gap-3">
                    {sortedSkills.map((skill, i) => {
                      const isImportant = project.importantSkills?.includes(skill);
                      const badgeBg = isImportant
                        ? dark
                          ? "bg-purple-800"
                          : "bg-purple-200"
                        : dark
                        ? "bg-gray-700"
                        : "bg-gray-200";
                      const badgeBorder = isImportant
                        ? dark
                          ? "border-purple-600"
                          : "border-purple-300"
                        : dark
                        ? "border-gray-600"
                        : "border-gray-300";

                      return (
                        <span
                          key={i}
                          className={`px-5 py-2 text-sm font-medium rounded-full border ${badgeBg} ${badgeBorder}`}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>

                  <div className="pt-4">
                    {project.completion !== undefined && <ProgressBar value={project.completion} label="Completion" />}
                    {project.aiUsage !== undefined && <ProgressBar value={project.aiUsage} label="Estimated AI Usage" />}
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
        );
      })}

      {/* FIXED LOCATION: The paragraph is now inside the function scope so 'dark' is accessible */}
      <p
        className={`
            text-sm font-thin opacity-70
            w-full text-center mt-8
            transform -translate-y-4
            ${dark ? "text-neutral-300" : "text-neutral-600"}
        `}
        style={{ maxWidth: "100%" }}
      >
        NOTE:
        Some features unavailable in mobile viewing.<br />
        Mouse - hover over features on desktop for more details.
      </p>

    </div>
  );
}