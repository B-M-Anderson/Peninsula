import type { Metadata } from "next";
import PageFrame from "../components/PageFrame";
import AskClient from "./AskClient";
import { openGraphFor } from "../lib/og";
import { StyleView } from "../lib/stylePref";
import { serverStyleDefault } from "../lib/styleServer";

const description = "Ask a small language model, running on my own desktop, about my work — no cloud, no API key.";

export const metadata: Metadata = {
  title: "Ask",
  description,
  alternates: { canonical: "/ask" },
  openGraph: openGraphFor("/ask", description),
};

export default async function AskPage() {
  const plain = (
    <PageFrame title="Ask" subtitle="A small model on my desktop, answering for me" maxWidth={760} minHeight="60vh">
      <AskClient variant="plain" />
    </PageFrame>
  );
  return <StyleView page="ask" themed={<AskClient variant="notebook" />} plain={plain} serverDefault={await serverStyleDefault()} />;
}
