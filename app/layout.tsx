import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "B. A.",
  description: "Personal portfolio of B. Anderson",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className="min-h-screen transition-colors duration-300">
        <Navbar />
        <main className="p-8">{children}</main>
      </body>
    </html>
  );
}

