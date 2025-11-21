export default function ProjectsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold mb-8">Projects & Publications</h1>

      {/* Example project entry */}
      <div className="mb-8 p-6 border rounded-lg shadow dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-2">Bennett-Anderson.com</h2>
        <p className="opacity-80 whitespace-pre-line">
    You're looking at this one! <br /><br />
    My personal website, built from scratch using Next.js, TypeScript, and Tailwind CSS. 
    It's deployed & hosted by Vercel with a custom domain from Squarespace. 
    It features an auto-detecting dark mode toggle, a screen-size responsive navigation bar & homepage + other designs & animations, all intended to showcases my projects and skills. <br /><br />
    Feel free to explore the code on my GitHub in my first public repository! 
    (It took some time to realize I didn't need to push every update to see how it works so early commits are messy and abundant)<br /><br />
    Note: my learning of textscript website development sourced a lot of early information from LLM-AIs. 
    Many fixes & feature/content implementations were done by me, but original code and ongoing feature information is/was AI-assisted. 
    The more I do and improve to this website, the more I continue to learn to do on my own!
  </p>

  {/* GitHub link */}
  <a
    href="https://github.com/B-M-Anderson/peninsula"
    target="_blank"
    rel="noopener noreferrer"
    className="mt-4 inline-block text-blue-600 hover:underline"
  >
    View on GitHub
  </a>
</div>


      {/* Example project entry 
      <div className="mb-8 p-6 border rounded-lg shadow dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-2">proj title</h2>
        <p className="opacity-80">
          blah blah blah insert project here
        </p>
      </div>*/}
    </div>
  );
}
