"use client";

import { motion } from "framer-motion";
import { CONTACT_EMAIL, CONTACT_PHONE, LINKEDIN_URL } from "../data/site";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col pt-22">
      {/* animated header banner */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="w-full h-40 flex items-center justify-center relative"
      >
        <div className="absolute inset-0 rounded-3xl overflow-hidden term-panel" />
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-term text-3xl sm:text-4xl font-bold z-10 text-bio-green dark:text-phos glow"
        >
          &gt; open-channel 📬
        </motion.h1>
      </motion.header>

      {/* Page content */}
      <main className="max-w-2xl mx-auto py-16 px-6 flex flex-col items-center">
        <div className="term-panel rounded-lg p-8 w-full">
          <p className="font-term text-xs opacity-50 mb-4">
            handshake protocol: context required in first transmission, or the
            packet gets dropped.
          </p>
          <p className="mb-6 text-center text-sm leading-relaxed opacity-90">
            Feel free to reach out via email, phone, or LinkedIn.
            If using phone or email, please provide context in your first
            message or it will likely be ignored.
          </p>

          <ul className="space-y-4 text-center font-term text-sm">
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-bio-cyan dark:text-cyto hover:underline"
              >
                ✉️ email://{CONTACT_EMAIL}
              </a>
            </li>
            <li className="opacity-85">📞 voice://{CONTACT_PHONE}</li>
            <li>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-bio-cyan dark:text-cyto hover:underline"
              >
                💼 linkedin://bennett-m-anderson
              </a>
            </li>
          </ul>
        </div>

        <p className="font-term text-[10px] opacity-30 mt-8">
          channel encrypted (socially, not cryptographically)
        </p>
      </main>
    </div>
  );
}
