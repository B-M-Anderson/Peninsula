import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "B. Anderson",
  description: "Personal portfolio of B. Anderson",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Global Navbar */}
        <nav className="flex justify-between items-center px-8 py-4 border-b dark:border-gray-700">
          <h1 className="text-2xl font-bold">B. Anderson</h1>
          <div className="flex gap-6">
            <Link href="/">Home</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

