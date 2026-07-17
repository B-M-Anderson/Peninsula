"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import SkillsSection from "./components/SkillsSection";
import SubstackFeed from "./components/SubstackFeed";
import AsciiDna from "./components/AsciiDna";
import { useVault } from "./components/VaultGate";
import { GITHUB_USER, GITHUB_URL, LINKEDIN_URL, RESUME_PATH, SUBSTACK_URL } from "./data/site";

type Repo = {
  id: number;
  name: string;
  description: string;
  html_url: string;
  fork: boolean;
  owner: { login: string };
  language?: string;
};

const featuredProjects = [
  {
    name: "Local-LLM Site Concierge",
    tag: "wip",
    description:
      "An AI assistant for this site, running on a small language model on my own desktop — no cloud inference. Architecture specced, build underway.",
    path: "/projects",
  },
  {
    name: "Portfolio Website",
    tag: "ongoing",
    description:
      "This site. Next.js + TypeScript + Tailwind, deployed on Vercel. Recently rebuilt with the cyber-bio interface you're looking at.",
    path: "/projects",
  },
  {
    name: "Resume, Redesigned!",
    tag: "done",
    description:
      "My resume rebuilt fully in LaTeX (XeLaTeX + AltaCV). Downloadable from the specimen card on the left.",
    path: "/projects",
  },
];

const catPhotos = [
  "/cats/Penny1.jpeg",
  "/cats/Penny2.jpeg",
  "/cats/Penny3.jpeg",
  "/cats/Penny4.jpeg",
  "/cats/Penny5.jpeg",
  "/cats/Penny6.jpeg",
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="font-term text-2xl font-bold mb-6 text-bio-green dark:text-phos glow glitch"
    >
      <span className="text-bio-dim dark:text-phos-dim">&gt;</span> {children}
    </motion.h2>
  );
}

const tagStyles: Record<string, string> = {
  wip: "text-bio-amber dark:text-warn border-bio-amber/40 dark:border-warn/40",
  ongoing: "text-bio-cyan dark:text-cyto border-bio-cyan/40 dark:border-cyto/40",
  done: "text-bio-green dark:text-phos border-bio-green/40 dark:border-phos/40",
};

export default function HomePage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const { summonVault } = useVault();

  useEffect(() => {
    fetch(`https://api.github.com/users/${GITHUB_USER}/repos`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const filtered = data.filter(
          (repo: Repo) => !repo.fork && repo.owner.login === GITHUB_USER
        );
        setRepos(filtered);
      })
      .catch(console.error);
  }, []);

  return (
    <>
      {/* hide the scroll panel's scrollbar but keep functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        #scroll-panel::-webkit-scrollbar { display: none; }
        #scroll-panel { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <main className="flex flex-col md:flex-row md:h-screen w-full max-w-full">
        {/* LEFT: specimen card */}
        <section className="w-full md:w-1/3 p-4 sm:p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-bio-line dark:border-grid-line pt-[80px] md:pt-0 max-w-full">
          <div className="p-6 w-full max-w-sm">
            <p className="font-term text-[11px] opacity-50 text-left mb-4">
              {"// bma.profile — bioengineering × code"}
            </p>
            <Image
              src="/profile.jpeg"
              alt="Profile picture"
              width={180}
              height={180}
              className="rounded-full mx-auto mb-5"
            />
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-term text-2xl font-bold mb-1 text-bio-green dark:text-phos glow"
            >
              &gt; whoami
            </motion.h2>
            <p className="font-term text-sm opacity-60 mb-4">Bennett M. Anderson</p>
            <p className="text-base leading-relaxed opacity-90 mb-6 text-left">
              Biomedical engineering student splicing together wet-lab
              instincts and computational skills — with the end goal of
              engineering better outcomes for global health. Currently
              culturing: code, bacteria, and one very demanding cat.
            </p>

            {/* Links — pure text, no chrome */}
            <div className="flex flex-col gap-2.5 w-full font-term text-sm text-left">
              <a href={RESUME_PATH} download className="text-bio-green dark:text-phos hover:glow transition-all">
                [ download resume.pdf ]
              </a>
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="text-bio-cyan dark:text-cyto hover:glow-cyan transition-all">
                [ linkedin --connect ]
              </a>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-bio-magenta dark:text-plasmid hover:chroma transition-all">
                [ github --clone-me ]
              </a>
              {SUBSTACK_URL && (
                <a href={SUBSTACK_URL} target="_blank" rel="noopener noreferrer" className="text-bio-amber dark:text-warn hover:glow transition-all">
                  [ substack --subscribe ]
                </a>
              )}
              <Link href="/ask" className="text-bio-green dark:text-phos-bright hover:glow transition-all">
                [ ask the machine → ]
              </Link>
            </div>
          </div>

          {/* mobile: horizontal strand spanning full width below the profile card */}
          {/* full-bleed: the parent is a centered flex column, so a 100vw child centers on the viewport → edge-to-edge */}
          <div className="md:hidden mt-6 h-32 w-screen">
            <AsciiDna mode="horizontal" onSummon={summonVault} />
          </div>
        </section>

        {/* MIDDLE: full-height DNA pillar (desktop only) */}
        <div className="hidden md:block md:w-44 shrink-0 self-stretch">
          <AsciiDna mode="vertical" onSummon={summonVault} />
        </div>

        {/* RIGHT: scrolling content */}
        <section
          id="scroll-panel"
          className="w-full md:flex-1 p-4 sm:p-8 pt-[16px] md:pt-16 space-y-14 overflow-y-auto h-full max-w-full"
        >
          {/* Featured Projects */}
          <div>
            <SectionHeading>projects --featured</SectionHeading>
            <div className="grid gap-5">
              {featuredProjects.map((project, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx, duration: 0.6 }}
                  className="term-panel rounded-lg p-6 relative"
                >
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-term text-lg font-semibold">{project.name}</h3>
                    <span className={`font-term text-[10px] px-2 py-0.5 rounded-full border ${tagStyles[project.tag]}`}>
                      {project.tag}
                    </span>
                  </div>
                  <p className="opacity-80 mb-3 text-sm leading-relaxed">{project.description}</p>
                  <Link href={project.path} className="font-term text-sm text-bio-cyan dark:text-cyto hover:underline">
                    → open in ~/projects
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* GitHub Repositories */}
          <div>
            <SectionHeading>repos --live-from-github</SectionHeading>
            <div className="grid gap-5">
              {repos.length === 0 && (
                <p className="font-term text-sm opacity-50">
                  querying api.github.com<span className="cursor-blink">▮</span>
                </p>
              )}
              {repos.map((repo, idx) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx, duration: 0.6 }}
                  className="relative term-panel p-6 pr-20 rounded-lg"
                >
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 w-12 h-12 overflow-hidden rounded-lg border border-bio-line dark:border-grid-line">
                    <Image
                      src={`/thumbnails/${repo.name.replace(/\s+/g, "")}.png`}
                      alt={`${repo.name} thumbnail`}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/thumbnails/default.png";
                      }}
                    />
                  </div>
                  <h3 className="font-term text-lg font-semibold mb-1">{repo.name}</h3>
                  {repo.language && (
                    <span className="font-term text-xs text-bio-magenta dark:text-plasmid opacity-80 mb-2 block">
                      lang: {repo.language}
                    </span>
                  )}
                  <p className="opacity-80 mb-2 text-sm">{repo.description}</p>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-term text-sm text-bio-cyan dark:text-cyto hover:underline"
                  >
                    → view source
                  </a>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <SkillsSection />

          {/* Substack feed */}
          <SubstackFeed />

          {/* Cat Photo Album */}
          <div>
            <SectionHeading>cat penrose.log 😺</SectionHeading>
            <p className="font-term text-xs opacity-50 mb-1">
              lab assistant · quality assurance (naps on keyboards) · morale
            </p>
            <p className="font-term text-xs opacity-35 mb-4">
              {"// she answers to her name. type it anywhere."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {catPhotos.map((photo, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx, duration: 0.6 }}
                  className="overflow-hidden rounded-lg term-panel"
                >
                  <Image
                    src={photo}
                    alt={`Penrose the cat, observation ${idx + 1}`}
                    width={400}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                  <p className="font-term text-[10px] opacity-50 px-2 py-1">
                    obs_{String(idx + 1).padStart(3, "0")}.jpeg
                  </p>
                </motion.div>
              ))}
            </div>
            <Link href="/darkroom" className="font-term text-sm text-bio-cyan dark:text-cyto hover:underline inline-block mt-4">
              → more prints in the darkroom
            </Link>
          </div>

          {/* footer note */}
          <p className="font-term text-xs opacity-50 w-full text-center mt-8 pb-4">
            NOTE: optimized for desktop dark-mode viewing — other configurations
            uphold functionality at the cost of aesthetics.
            <br />
            <span className="opacity-70">there is more here than the nav lets on.</span>
          </p>
        </section>
      </main>
    </>
  );
}
