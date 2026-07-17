"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SUBSTACK_URL } from "../data/site";

type Post = { title: string; link: string; pubDate: string; snippet: string };
type FeedState = { loading: boolean; configured: boolean; posts: Post[] };

export default function SubstackFeed() {
  const [feed, setFeed] = useState<FeedState>({ loading: true, configured: false, posts: [] });

  useEffect(() => {
    fetch("/api/substack")
      .then((r) => r.json())
      .then((data) => setFeed({ loading: false, configured: data.configured, posts: data.posts ?? [] }))
      .catch(() => setFeed({ loading: false, configured: false, posts: [] }));
  }, []);

  return (
    <div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="font-term text-2xl font-bold mb-6 text-bio-green dark:text-phos glow"
      >
        <span className="text-bio-dim dark:text-phos-dim">&gt;</span> substack --latest
      </motion.h2>

      {feed.loading && (
        <p className="font-term text-sm opacity-60">
          polling feed<span className="cursor-blink">▮</span>
        </p>
      )}

      {!feed.loading && !feed.configured && (
        <div className="term-panel rounded-lg p-6 font-term text-sm">
          <p className="text-bio-dim dark:text-phos-dim">
            [ signal not yet acquired ]
          </p>
          <p className="mt-2 opacity-70">
            Writing feed coming online soon. Transmissions will appear here.
          </p>
        </div>
      )}

      {!feed.loading && feed.configured && feed.posts.length === 0 && (
        <div className="term-panel rounded-lg p-6 font-term text-sm opacity-70">
          [ feed acquired — no transmissions found ]
        </div>
      )}

      {feed.posts.length > 0 && (
        <div className="grid gap-4">
          {feed.posts.map((post, idx) => (
            <motion.a
              key={post.link || idx}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.5 }}
              className="term-panel rounded-lg p-5 block hover:border-bio-green dark:hover:border-phos transition-colors"
            >
              <h3 className="font-term font-semibold text-bio-green dark:text-phos-bright">{post.title}</h3>
              {post.pubDate && (
                <span className="font-term text-xs opacity-60 block mt-1">{post.pubDate}</span>
              )}
              {post.snippet && <p className="text-sm opacity-80 mt-2">{post.snippet}…</p>}
            </motion.a>
          ))}
        </div>
      )}

      {SUBSTACK_URL && (
        <a
          href={SUBSTACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-term text-sm text-bio-cyan dark:text-cyto hover:underline inline-block mt-4"
        >
          → all transmissions
        </a>
      )}
    </div>
  );
}
