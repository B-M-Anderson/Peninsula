"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import SkillsSection from "./components/SkillsSection";
import Link from "next/link";

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
    name: "Portfolio Website",
    description:
      "This website! Built with Next.js, Tailwind, and TypeScript. Hosted on Vercel with a custom domain from Squarespace. More in 'projects' section.",
    path: "/projects",
  },
  {
    name: "Resume, Redesigned!",
    description:
      "As dowloadable in the 'About Me' section or Github, My resume redesigned fully in LaTeX, compiled with XeLaTeX using AltaCV document class. More in  'projects' section.",
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

export default function HomePage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [dark, setDark] = useState(false);

  // Fetch GitHub repos
  useEffect(() => {
    fetch("https://api.github.com/users/B-M-Anderson/repos")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (repo: Repo) => !repo.fork && repo.owner.login === "B-M-Anderson"
        );
        setRepos(filtered);
      })
      .catch(console.error);
  }, []);

  // Detect system dark mode
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(media.matches);

    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  return (
    <>
      {/* CSS to hide the scrollbar but keep functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        #scroll-panel::-webkit-scrollbar {
          display: none;
        }
        #scroll-panel {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}} />

      <main className="flex flex-col md:flex-row md:h-screen w-full max-w-full">
        {/* LEFT: About Me */}
        <section
          className="w-full md:w-1/3
            p-4 sm:p-8
            flex flex-col items-center justify-center text-center
            border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700
            pt-[80px] md:pt-0
            max-w-full"
        >
          <Image
            src="/profile.jpeg"
            alt="Profile picture"
            width={200}
            height={200}
            className="rounded-full mb-6"
          />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold mb-4"
          >
            About Me
          </motion.h2>
          <p className="text-lg leading-relaxed opacity-90 mb-6">
            I'm a biomedical engineering student working to improve my skills,
            computational and otherwise, to become the best engineer/scientist I
            can in the pursuit of the betterment of global health.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-4 w-full">
            {/* Resume */}
            <a
              href="/ResumeBennettAnderson.pdf"
              download
              className={`px-4 py-2 rounded-lg text-white shadow-sm transition-all duration-300 text-center transform ${
                dark
                  ? "bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-700 hover:to-blue-500 hover:scale-105"
                  : "bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 hover:scale-105"
              }`}
            >
              Download Resume 📄
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/bennett-m-anderson/"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-lg text-white shadow-sm transition-all duration-300 text-center transform ${
                dark
                  ? "bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 hover:scale-105"
                  : "bg-gradient-to-r from-gray-500 to-gray-400 hover:from-gray-400 hover:to-gray-300 hover:scale-105"
              }`}
            >
              LinkedIn 🔗
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/B-M-Anderson"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-lg text-white shadow-sm transition-all duration-300 text-center transform ${
                dark
                  ? "bg-gradient-to-r from-green-900 to-green-700 hover:from-green-700 hover:to-green-500 hover:scale-105"
                  : "bg-gradient-to-r from-green-700 to-green-500 hover:from-green-500 hover:to-green-300 hover:scale-105"
              }`}
            >
              GitHub 🌐
            </a>
          </div>
        </section>

        {/* RIGHT: Scrolling content */}
        <section
          id="scroll-panel"
          className="w-full md:w-2/3 p-4 sm:p-8 pt-[16px] md:pt-16 space-y-12 overflow-y-auto h-full max-w-full"
        >
          {/* Featured Projects */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold mb-6"
            >
              Featured Projects 🚀
            </motion.h2>
            <div className="grid gap-6">
              {featuredProjects.map((project, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx, duration: 0.6 }}
                  className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg shadow relative"
                >
                  <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                  <p className="opacity-80 mb-2">{project.description}</p>
                  <Link href={project.path} className="text-blue-600 hover:underline">
                    Move To Projects ⯈
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* GitHub Repositories */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold mb-6"
            >
              GitHub Repositories⚡
            </motion.h2>
            <div className="grid gap-6">
              {repos.map((repo, idx) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx, duration: 0.6 }}
                  className="relative p-6 pr-20 border border-gray-200 dark:border-gray-700 rounded-lg shadow"
                >
                  {/* Thumbnail */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 w-12 h-12 overflow-hidden rounded-lg shadow">
                    <Image
                      src={`/thumbnails/${repo.name.replace(/\s+/g, "")}.png`}
                      alt={`${repo.name} thumbnail`}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "/thumbnails/default.png";
                      }}
                    />
                  </div>

                  <h3 className="text-xl font-semibold mb-1">{repo.name}</h3>
                  {repo.language && (
                    <span className="text-xs opacity-70 mb-2 block">{repo.language}</span>
                  )}
                  <p className="opacity-80 mb-2">{repo.description}</p>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    View on GitHub
                  </a>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <SkillsSection />

          {/* Cat Photo Album */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold mb-6"
            >
              My Cat Penrose 😺 :3
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {catPhotos.map((photo, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx, duration: 0.6 }}
                  className="overflow-hidden rounded-lg shadow"
                >
                  <Image
                    src={photo}
                    alt={`Cat ${idx + 1}`}
                    width={400}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                </motion.div>
              ))}
            </div>
          </div>
          {/* optimal setup note */}
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
            This website is optimized for desktop dark-mode viewing.<br />
            Other viewing options should uphold functionality at the cost of aesthetics
          </p>
        </section>
      </main>
    </>
  );
}