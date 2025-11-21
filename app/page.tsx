"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function HomePage() {
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? "dark bg-gray-900 text-white min-h-screen" : "bg-white text-gray-900 min-h-screen"}>
      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-4 border-b dark:border-gray-700">
        <h1 className="text-2xl font-bold">Test Anderson</h1>
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

      {/* MAIN SPLIT SECTION */}
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        {/* LEFT THIRD: About Me */}
        <section id="about" className="md:w-1/3 p-8 flex flex-col items-center text-center border-r dark:border-gray-700">
          <Image
            src="/profile.jpg" // put your image in /public/profile.jpg
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
              Download Resume
            </a>
            <a
              href="https://www.linkedin.com/in/bennett-m-anderson/"
              target="_blank"
              className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-900 transition"
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

          <div className="mb-6">
            <a
              href="https://github.com/yourusername"
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Visit my GitHub
            </a>
          </div>

          <div className="grid gap-6">
            {/* Example project card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="p-6 border rounded-lg shadow dark:border-gray-700"
            >
              <h3 className="text-xl font-semibold mb-2">Project Title</h3>
              <p className="opacity-80">Short description of the project.</p>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
