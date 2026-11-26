import type { Metadata } from "next";
import PageFrame from "../components/PageFrame";
import ChessClient from "./ChessClient";
import { openGraphFor } from "../lib/og";

const description = "Play Jewel, the chess engine I'm writing in Julia. It runs on the same old desktop in my house as askB.AI and updates itself whenever I push a new version.";

export const metadata: Metadata = {
  title: "Play Jewel",
  description,
  alternates: { canonical: "/chess" },
  openGraph: openGraphFor("/chess", description),
};

export default function ChessPage() {
  return (
    <PageFrame title="Play Jewel" subtitle="A chess engine I'm writing in Julia, running on the desktop in my house" maxWidth={980} minHeight="60vh">
      <ChessClient />
    </PageFrame>
  );
}
