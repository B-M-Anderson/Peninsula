"use client";

type Project = {
  title: string;
  description: string;
  githubUrl?: string;
  date: string; // <-- add a date field
};

const projects: Project[] = [
  {
    title: "Bennett-Anderson.com",
    description: `You're looking at this one! 

My personal website, designed for desktop and mobile use, built from scratch using Next.js, TypeScript, and Tailwind CSS. 
Deployed & hosted by Vercel with a custom domain from Squarespace. 
It features an auto-detecting dark mode toggle, a screen-size responsive navigation bar (that retracts) & homepage + other designs & animations, all intended to showcase my projects and skills. 

Feel free to explore the code on my GitHub in my first public repository! 
(It took some time to realize I didn't need to push every update to see how it works, and I still have to for mobile testing, so early commits are messy and abundant.)

Note: my learning of textscript website development sourced a lot of early information from LLM-AIs. 
Many fixes & feature/content implementations were done by me, but original code and ongoing feature information is/was AI-assisted. 
The more I do and improve this website, the more I continue to learn to do on my own!`,
    githubUrl: "https://github.com/B-M-Anderson/peninsula",
    date: "November 22, 2025", // <-- input date here
  },
  // Add more projects here with your own dates
];

export default function ProjectsPage() {
  return (
    <div className="max-w-4xl mx-auto py-18 px-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Projects & Publications
      </h1>

      {projects.map((project, idx) => (
        <div
          key={idx}
          className="relative mb-8 p-6 pt-16 border rounded-lg shadow dark:border-gray-700"
        >
          {/* Date in top-right */}
          <div className="absolute top-4 right-4 text-sm text-gray-500 dark:text-gray-400">
            {project.date}
          </div>

          <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
          <p className="opacity-80 whitespace-pre-line">{project.description}</p>

          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              View on GitHub
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
