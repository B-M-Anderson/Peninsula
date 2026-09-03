import type { Metadata } from "next";
import PageFrame from "../components/PageFrame";
import DarkroomClient from "./DarkroomClient";

export const metadata: Metadata = {
  title: "Darkroom",
  description: "Field observations, developed on site.",
  // Linked from the front page for people, not for search engines.
  robots: { index: false, follow: false },
};

export default function DarkroomPage() {
  return (
    <PageFrame title="Darkroom" subtitle="Field observations, developed on site">
      <DarkroomClient />
    </PageFrame>
  );
}
