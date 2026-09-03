import type { Metadata } from "next";
import PageFrame from "../components/PageFrame";
import AskClient from "./AskClient";
import { openGraphFor } from "../lib/og";

const description = "Ask a small language model, running on my own desktop, about my work — no cloud, no API key.";

export const metadata: Metadata = {
  title: "Ask",
  description,
  alternates: { canonical: "/ask" },
  openGraph: openGraphFor("/ask", description),
};

export default function AskPage() {
  return (
    <PageFrame title="Ask" subtitle="A small model on my desktop, answering for me" maxWidth={760} minHeight="60vh">
      <AskClient />
    </PageFrame>
  );
}
