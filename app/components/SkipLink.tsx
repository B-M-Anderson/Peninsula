"use client";

/**
 * "Skip to content" for keyboard users. Moves focus to the page's <main>
 * without rewriting the URL fragment, so a deep link such as /projects#pitv
 * keeps its #hash (the accordion follows that hash).
 */
export default function SkipLink() {
  return (
    <a
      href="#main"
      className="md-skip-link md-btn md-btn-primary md-btn-sm"
      onClick={(e) => {
        const main = document.getElementById("main");
        if (!main) return;
        e.preventDefault();
        main.focus({ preventScroll: true });
        main.scrollIntoView({ block: "start" });
      }}
    >
      Skip to content
    </a>
  );
}
