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
};

const featuredProjects = [
  {
    name: "Portfolio Website",
    description: "This website! Built with Next.js, Tailwind, and TypeScript. Hosted on Vercel with a custom domain from Squarespace. More in 'projects' section",
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

  return (
    <main className="flex flex-col md:flex-row md:h-screen">
      {/* LEFT: About Me */}
      <section
        className="w-full md:w-1/3 p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 pt-[80px] md:pt-0" // <-- mobile only padding for navbar
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
          <a
            href="/BennettA_Resume.pdf"
            download
            className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-700 transition-colors duration-300 text-center"
          >
            Download Resume 📄
          </a>

          <a
            href="https://www.linkedin.com/in/bennett-m-anderson/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors duration-300 text-center"
          >
            LinkedIn 🔗
          </a>

          <a
            href="https://github.com/B-M-Anderson"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-700 transition-colors duration-300 text-center"
          >
            GitHub 🌐
          </a>
        </div>
      </section>

      {/* RIGHT: Scrolling content */}
      <section
        id="scroll-panel"
        className="w-full md:w-2/3 p-8 pt-16 md:pt-16 space-y-12 overflow-y-auto h-full"
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
                className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                <p className="opacity-80 mb-2">{project.description}</p>
                <Link
                  href={project.path}
                  className="text-blue-600 hover:underline"
                >
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
            GitHub Repositories ⚡
          </motion.h2>
          <div className="grid gap-6">
            {repos.map((repo, idx) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx, duration: 0.6 }}
                className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{repo.name}</h3>
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

        <SkillsSection />

        {/* Cat Photo Album */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold mb-6"
          >
            My Cat Penrose😺 :3
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
      </section>
    </main>
  );
}
