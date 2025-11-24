"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Camera, Video } from "lucide-react";

// media: "photo" | "video" | "both" | "none" | undefined
type Project = {
  title: string;
  description: string;
  githubUrl?: string;
  date: string;
  skills: string[];
  media?: "photo" | "video" | "both" | "none";
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
The more I do and improve this website, the more I continue to learn to do on my own!
`,
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
    media: "none",
  },
  {
    title: "MP3 Merger / Cross-Fader",
    description: `A quick Python project for blending multiple MP3 files with smooth crossfades,
dynamic EQ tweaks, and audio visualization. Likely to be updated in the future!.

~(Section update & video demo coming soon)`,
    githubUrl: "https://github.com/B-M-Anderson/mp3-Playlist-Crossfader",
    date: "November 24, 2025",
    skills: ["Python", "Audio Processing", "Git/GitHub", "pydub", "matplotlib"],
    media: "video",
  },
];

export default function ProjectsPage() {
  const [expanded, setExpanded] = useState<number[]>([]);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const checkDark = () =>
      setDark(document.documentElement.classList.contains("dark"));
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Allows more than one section open
  const toggleExpand = (idx: number) => {
    setExpanded((prev) =>
      prev.includes(idx)
        ? prev.filter((i) => i !== idx) // close
        : [...prev, idx] // open
    );
  };

  const badgeBg = dark ? "bg-purple-800" : "bg-purple-200";
  const badgeBorder = dark ? "border-purple-600" : "border-purple-300";
  const badgeText = "text-current";

  const renderMediaTag = (media?: Project["media"]) => {
    if (!media || media === "none") return null;

    const base =
      "flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border opacity-75";
    const style = `${base} ${dark ? "border-gray-600" : "border-gray-300"}`;

    if (media === "photo")
      return (
        <span className={style}>
          <Camera className="w-4 h-4" /> Photo Demo
        </span>
      );
    if (media === "video")
      return (
        <span className={style}>
          <Video className="w-4 h-4" /> Video Demo
        </span>
      );
    if (media === "both")
      return (
        <span className={style}>
          <Camera className="w-4 h-4" /> <Video className="w-4 h-4" /> Photo & Video
        </span>
      );
  };

  return (
    <div className="max-w-4xl mx-auto py-18 px-6 space-y-6">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Projects & Publications
      </h1>

      {projects.map((project, idx) => {
        const isOpen = expanded.includes(idx);

        return (
          <div
            key={idx}
            className="relative border rounded-lg shadow dark:border-gray-700"
          >
            <button
              onClick={() => toggleExpand(idx)}
              className="w-full flex items-center justify-between p-6 focus:outline-none"
            >
              <div className="flex flex-col text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  <h2 className="text-xl font-semibold">{project.title}</h2>
                  {renderMediaTag(project.media)}
                </div>

                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {project.date}
                </span>
              </div>

              <ChevronDown
                className={`h-6 w-6 text-gray-500 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="opacity-90 whitespace-pre-line mb-4">
                  {project.description}
                </p>

                <div className="mb-4">
                  <h3 className="text-sm pt-4 font-semibold mb-2">
                    Highlighted Skills:
                  </h3>
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
        );
      })}
    </div>
  );
}
