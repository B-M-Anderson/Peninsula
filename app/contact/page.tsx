"use client";

import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col pt-22"> 
      {/* 👆 Add pt-24 to push everything below the fixed navbar */}

      {/* Full-width animated header/banner */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="w-full h-40 flex items-center justify-center relative"
      >
        {/* Dark blue rectangle with dramatic gradient and fully rounded corners */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 opacity-95 rounded-3xl"></div>
        </div>

        {/* Header text on top */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold text-white z-10 drop-shadow-lg"
        >
          Contact 📬
        </motion.h1>
      </motion.header>

      {/* Page content */}
      <main className="max-w-2xl mx-auto py-16 px-6 flex flex-col items-center">
        <p className="mb-4 text-center">
          Feel free to reach out to me via email, phone, or connect with me on LinkedIn. 
          If using phone or email, please provide context in your first message or it 
          will likely be ignored.
        </p>

        <ul className="space-y-4 text-center">
          <li>
            <a
              href="mailto:bennetta32.30@gmail.com"
              className="text-blue-400 hover:underline dark:text-blue-300"
            >
              ✉️ Email: bennetta32.30@gmail.com
            </a>
          </li>
          <li>📞 Phone: (815) 821-9604</li>
          <li>
            <a
              href="https://www.linkedin.com/in/bennett-m-anderson/"
              target="_blank"
              className="text-blue-400 hover:underline dark:text-blue-300"
            >
              💼 LinkedIn Profile
            </a>
          </li>
        </ul>
      </main>
    </div>
  );
}
