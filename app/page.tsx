"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

type Repo = {
  id: number;
  name: string;
  description: string;
  html_url: string;
  fork: boolean;
  owner: { login: string };
};

// Dummy featured projects data
const featuredProjects = [
  {
    name: "Portfolio Website",
    description: "This website! Built with Next.js, Tailwind, and TypeScript.",
    url: "https://github.com/B-M-Anderson/peninsula",
  },
  {
    name: "Example_2",
    description: "Fill in later.",
    url: "#",
  },
];

// Dummy skills stack
const skills = [
  "TypeScript",
  "React / Next.js",
  "Tailwind CSS",
  "MATLAB",
  "CRISPR Modeling",
  "Python",
  "Data Analysis",
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
    <main className="flex min-h-[calc(100vh-4rem)]">
      {/* LEFT: About Me */}
      <section className="md:w-1/3 p-8 flex flex-col items-center text-center border-r border-gray-200 dark:border-gray-700 sticky top-0 h-screen">
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
          About Me!
        </motion.h2>
        <p className="text-lg leading-relaxed opacity-90 mb-6">
          I'm a biomedical engineering student working to improve my skills, computational and otherwise, to become the best engineer/scientist I can in the pursuit of the betterment of global health.
        </p>

        {/* Buttons */}
  <div className="flex flex-col gap-4 mt-4 w-full">
    <a
      href="/BennettA_Resume.pdf"
      download
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-center"
    >
      Download Resume
    </a>
    <a
      href="https://www.linkedin.com/in/bennett-m-anderson/"
      target="_blank"
      className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition dark:bg-gray-800 dark:text-white dark:hover:bg-gray-900 text-center"
    >
      LinkedIn
    </a>
  </div>
</section>


      {/* RIGHT: Scrolling content */}
      <section className="md:w-2/3 p-8 space-y-12 overflow-y-auto">
        {/* Featured Projects */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold mb-6"
          >
            Featured Projects
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
                <a
                  href={project.url}
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  View Project
                </a>
              </motion.div>
            ))}
          </div>
        </div>

        {/* GitHub Feed */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold mb-6"
          >
            GitHub Repositories
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

        {/* Skills Stack */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold mb-6"
          >
            Skills
          </motion.h2>
          <div className="flex flex-wrap gap-4">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-full font-medium text-gray-900 dark:text-white"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Cat Photo Album */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold mb-6"
          >
            My Cat Penrose :3
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
