"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function HomePage() {
  const [repos, setRepos] = useState<any[]>([]);

  useEffect(() => {
    fetch("https://api.github.com/users/bennettanderson/repos") // replace with your GitHub username
      .then((res) => res.json())
      .then(setRepos)
      .catch(console.error);
  }, []);

  return (
    <main className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      {/* LEFT THIRD: About Me */}
      <section
        id="about"
        className="md:w-1/3 p-8 flex flex-col items-center text-center border-r border-gray-200 dark:border-gray-700"
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
          I'm a biomedical engineering student focused on computational modeling,
          pharmaceutical research, CRISPR-based tools, and modern biotechnology.
        </p>
        <div className="flex gap-4">
          <a
            href="/BennettA_Resume.pdf"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Open Resume
          </a>
          <a
            href="https://www.linkedin.com/in/bennett-m-anderson/"
            target="_blank"
            className="px-4 py-2 rounded bg-gray-200 text-gray-900 hover:bg-gray-300 transition dark:bg-gray-800 dark:text-white dark:hover:bg-gray-900"
          >
            LinkedIn
          </a>
        </div>
      </section>

      {/* RIGHT TWO-THIRDS: GitHub + Projects */}
      <section className="md:w-2/3 p-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold mb-6"
        >
          GitHub & Recent Projects
        </motion.h2>

        <div className="grid gap-6">
          {repos.map((repo) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
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
      </section>
    </main>
  );
}
