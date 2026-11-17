import type { Metadata } from "next";
import PageFrame from "../components/PageFrame";
import AskClient from "./AskClient";
import { openGraphFor } from "../lib/og";

const description = "Questions about my work, answered by a small language model running on an old desktop in my house. No data center, no AI company in the middle.";

export const metadata: Metadata = {
  title: "askB.AI",
  description,
  alternates: { canonical: "/ask" },
  openGraph: openGraphFor("/ask", description),
};

export default function AskPage() {
  return (
    <PageFrame title="askB.AI" subtitle="A small model on an old desktop in my house, answering for me" maxWidth={760} minHeight="60vh">
      <AskClient />
    </PageFrame>
  );
}
