export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold mb-8">Contact </h1>
      <p className="mb-4">
        Feel free to reach out to me via email, phone, or connect with me on LinkedIn. If using phone or email, please provide context in your first message or it will likely be ignored.
      </p>
      <ul className="space-y-4">
        <li>
          <a
            href="mailto:bennetta32.30@gmail.com"
            className="text-blue-600 hover:underline"
          >
            ✉️ Email: bennetta32.30@gmail.com
          </a>
        </li>
        <li>
          📞 Phone: (123) 456-7890
        </li>
        <li>
          <a
            href="https://www.linkedin.com/in/bennett-m-anderson/"
            target="_blank"
            className="text-blue-600 hover:underline"
          >
            💼 LinkedIn Profile
          </a>
        </li>
      </ul>
    </div>
  );
}
