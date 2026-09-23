import type { Metadata } from "next";
import PageFrame from "../components/PageFrame";
import AskClient from "./AskClient";
import { openGraphFor } from "../lib/og";
import { StyleView } from "../lib/stylePref";
import { serverStyleDefault } from "../lib/styleServer";

const description = "Questions about my work, answered by a small language model running on an old desktop in my house. No data center, no AI company in the middle.";

export const metadata: Metadata = {
  title: "askAI",
  description,
  alternates: { canonical: "/ask" },
  openGraph: openGraphFor("/ask", description),
};

export default async function AskPage() {
  const plain = (
    <PageFrame title="askAI" subtitle="A small model on an old desktop in my house, answering for me" maxWidth={760} minHeight="60vh">
      <AskClient variant="plain" />
    </PageFrame>
  );
  return <StyleView page="ask" themed={<AskClient variant="notebook" />} plain={plain} serverDefault={await serverStyleDefault()} />;
}
