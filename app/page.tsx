"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? "dark bg-gray-900 text-white" : "bg-white text-gray-900"}>
      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-4 border-b dark:border-gray-700">
        <h1 className="text-2xl font-bold">Your Name</h1>
        <div className="flex gap-6 items-center">
          <a href="#about" className="hover:opacity-75">About</a>
          <a href="/projects" className="hover:opacity-75">Projects</a>
          <a href="/contact" className="hover:opacity-75">Contact</a>
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-xl border dark:border-gray-700"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="flex flex-col items-center text-center py-32 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-bold mb-4"
        >
          Hi, I'm Your Name
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="max-w-xl text-lg mb-8 opacity-80"
        >
          Biomedical Engineering student specializing in computational research,
          drug design, and modern biotechnologies.
        </motion.p>

        <a
          href="/resume.pdf"
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Download Resume
        </a>
      </section>

      {/* ABOUT ME */}
      <section id="about" className="max-w-4xl mx-auto py-24 px-6">
        <h2 className="text-3xl font-bold mb-6 text-center">About Me</h2>
        <p className="text-lg leading-relaxed opacity-90">
          I'm a biomedical engineering student focused on computational modeling,
          pharmaceutical research, CRISPR-based tools, and modern biotechnology.
          I combine programming, biology, and engineering to build projects that
          bridge wet lab understanding and computational innovation.
        </p>
      </section>
    </div>
  );
}
