export default function ProjectsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold mb-8">Projects & Publications</h1>

      {/* Example project entry */}
      <div className="mb-8 p-6 border rounded-lg shadow dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-2">Computational Drug Design</h2>
        <p className="opacity-80">
          A project exploring molecular docking simulations and predictive modeling
          for novel therapeutic compounds.
        </p>
      </div>

      {/* Add more entries here */}
    </div>
  );
}
