"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Camera, Video } from "lucide-react";
import { projects, type Project } from "../data/projects";

function ProgressBar({ value, label }: { value: number; label: string }) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)));

  const barGradient = label.toLowerCase().includes("ai")
    ? "linear-gradient(90deg, #059669 0%, #34d399 50%, #6ee7b7 100%)"
    : "linear-gradient(90deg, #0e7490 0%, #22d3ee 50%, #a5f3fc 100%)";

  return (
    <div className="mt-4 relative w-full group">
      <div className="w-full h-2.5 rounded-full bg-bio-line/60 dark:bg-grid-line">
        <div className="h-full rounded-full" style={{ width: `${normalized}%`, background: barGradient }} />
      </div>
      <div
        className="absolute w-3 h-3 rounded-full bg-bio-bg dark:bg-abyss-surface border border-bio-dim dark:border-phos-dim"
        style={{ top: "15%", left: `${normalized}%`, transform: "translate(-50%, -50%)" }}
      >
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-bio-fg text-bio-bg dark:bg-phos dark:text-abyss font-term text-xs px-2 py-1 rounded-md pointer-events-none">
          {normalized}%
        </div>
      </div>
      <div className="flex justify-between font-term text-xs mt-1 opacity-70 px-1">
        <span>0%</span>
        <span>{label}</span>
        <span>100%</span>
      </div>
    </div>
  );
}

const statusConfig = {
  terminated: {
    label: "TERMINATED",
    className: "bg-red-400/30 text-red-800 dark:bg-red-400/20 dark:text-red-300 border-red-400/40",
    tooltip: "This project has been discontinued. The goal has been solved alternatively or is no longer relevant.",
  },
  completed: {
    label: "COMPLETED",
    className: "bg-bio-green/20 text-bio-green dark:bg-phos/15 dark:text-phos border-bio-green/40 dark:border-phos/40",
    tooltip: "This project is working as intended and will not be receiving regular further updates.",
  },
  ongoing: {
    label: "ONGOING",
    className: "bg-bio-cyan/20 text-bio-cyan dark:bg-cyto/15 dark:text-cyto border-bio-cyan/40 dark:border-cyto/40",
    tooltip: "This project is working, but will continue to receive updates and improvements.",
  },
  wip: {
    label: "WIP",
    className: "bg-bio-amber/20 text-bio-amber dark:bg-warn/15 dark:text-warn border-bio-amber/40 dark:border-warn/40",
    tooltip: "This project is not yet usable",
  },
  shelved: {
    label: "SHELVED",
    className: "bg-yellow-400/30 text-yellow-800 dark:bg-yellow-400/15 dark:text-yellow-300 border-yellow-400/40",
    tooltip: "This project is on hold and may be revisited upon completion of higher priority tasks.",
  },
} as const;

function StatusBar({ type }: { type: keyof typeof statusConfig }) {
  const cfg = statusConfig[type];
  return (
    <div className="group relative w-full text-center cursor-default">
      <span className={`font-term text-xs font-bold py-1 block rounded border ${cfg.className}`}>
        [{cfg.label}]
      </span>
      <span className="absolute left-1/2 -translate-x-1/2 -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-bio-fg text-bio-bg dark:bg-phos dark:text-abyss text-xs px-2 py-1 rounded pointer-events-none w-max max-w-[250px] z-20">
        {cfg.tooltip}
      </span>
    </div>
  );
}

const sortOptions = [
  { value: "date-new", label: "date: new → old" },
  { value: "date-old", label: "date: old → new" },
  { value: "completion-high", label: "completion: high → low" },
  { value: "completion-low", label: "completion: low → high" },
] as const;

type SortKey = (typeof sortOptions)[number]["value"];

export default function ProjectsPage() {
  const [expanded, setExpanded] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("date-new");
  const [sortOpen, setSortOpen] = useState(false);

  const sortedProjects = useMemo<Project[]>(() => {
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
    return sorted;
  }, [sortBy]);

  const toggleExpand = (idx: number) => {
    setExpanded((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  const renderMediaTag = (media?: Project["media"]) => {
    if (!media || media === "none") return null;
    const style =
      "flex items-center gap-1.5 font-term text-xs opacity-70 whitespace-nowrap";
    if (media === "photo") return <span className={style}><Camera className="w-3.5 h-3.5" /> photo</span>;
    if (media === "video") return <span className={style}><Video className="w-3.5 h-3.5" /> video</span>;
    if (media === "both") return <span className={style}><Camera className="w-3.5 h-3.5" /> <Video className="w-3.5 h-3.5" /> photo+video</span>;
  };

  return (
    <div className="max-w-4xl mx-auto py-18 px-6 space-y-6">
      <h1 className="font-term text-3xl font-bold mb-2 text-center text-bio-green dark:text-phos glow">
        &gt; ls ~/projects
      </h1>
      <p className="font-term text-xs opacity-50 text-center mb-8">
        {projects.length} entries · sorted output · click to expand
      </p>

      {/* Sort Dropdown */}
      <div className="flex justify-start mb-4 relative">
        <button
          onClick={() => setSortOpen((prev) => !prev)}
          className="font-term px-4 py-1.5 rounded-full text-sm flex items-center gap-2 focus:outline-none term-panel hover:border-bio-green dark:hover:border-phos transition-colors"
        >
          sort --by{" "}
          <span className="font-semibold text-bio-cyan dark:text-cyto">
            {sortOptions.find((o) => o.value === sortBy)?.label}
          </span>
        </button>

        {sortOpen && (
          <div className="absolute left-0 mt-10 w-56 rounded-md shadow-lg z-10 term-panel bg-bio-bg dark:bg-abyss">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSortBy(option.value);
                  setSortOpen(false);
                }}
                className="font-term w-full text-left px-4 py-2 text-sm transition-colors duration-150 hover:bg-bio-surface dark:hover:bg-abyss-surface"
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

        return (
          <div key={project.title} className="relative term-panel rounded-lg">
            <button
              onClick={() => toggleExpand(idx)}
              className="w-full flex items-center justify-between p-6 focus:outline-none"
            >
              <div className="flex flex-col text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  <h2 className="font-term text-xl font-semibold">{project.title}</h2>

                  {project.thumbnailUrl && (
                    <img
                      src={project.thumbnailUrl}
                      alt={`${project.title} thumbnail`}
                      className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded ml-0 sm:ml-2 mt-2 sm:mt-0 border border-bio-line dark:border-grid-line"
                    />
                  )}

                  {project.media && (
                    <div className="mt-3 sm:mt-0 sm:ml-2">{renderMediaTag(project.media)}</div>
                  )}
                </div>
                <span className="font-term text-sm opacity-60 mt-1 sm:mt-0">{project.date}</span>
              </div>

              <ChevronDown
                className={`h-6 w-6 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="p-6 pt-4 border-t border-bio-line dark:border-grid-line space-y-4">
                {project.imageUrl && (
                  <div className="w-full flex justify-center">
                    <img
                      src={project.imageUrl}
                      alt="Project Preview"
                      className="w-102 h-102 object-cover rounded-xl shadow-lg border border-bio-line dark:border-grid-line"
                    />
                  </div>
                )}

                {project.terminated && <StatusBar type="terminated" />}
                {project.completed && <StatusBar type="completed" />}
                {project.ongoing && <StatusBar type="ongoing" />}
                {project.wip && <StatusBar type="wip" />}
                {project.shelved && <StatusBar type="shelved" />}

                <p className="opacity-90 whitespace-pre-line text-sm leading-relaxed">{project.description}</p>

                <div>
                  <h3 className="font-term text-sm pt-2 font-semibold mb-2 opacity-70">&gt; skills --used</h3>
                  <div className="flex flex-wrap gap-3">
                    {sortedSkills.map((skill) => {
                      const isImportant = project.importantSkills?.includes(skill);
                      return (
                        <span
                          key={skill}
                          className={`font-term text-sm ${
                            isImportant
                              ? "text-bio-magenta dark:text-plasmid"
                              : "opacity-70"
                          }`}
                        >
                          {isImportant ? "▸" : "·"} {skill}
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
                    className="font-term pt-3 inline-block text-bio-cyan dark:text-cyto hover:underline text-sm"
                  >
                    → view source on github
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}

      <p className="font-term text-xs opacity-50 w-full text-center mt-8">
        NOTE: some features unavailable in mobile viewing.
        <br />
        hover over features on desktop for more details.
      </p>
    </div>
  );
}
