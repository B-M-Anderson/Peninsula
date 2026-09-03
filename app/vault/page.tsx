import type { Metadata } from "next";
import PageFrame from "../components/PageFrame";
import VaultClient from "./VaultClient";

export const metadata: Metadata = {
  title: "Vault",
  description: "Restricted partition.",
  robots: { index: false, follow: false },
};

export default function VaultPage() {
  return (
    <PageFrame title="Vault" subtitle="Restricted partition · session-scoped" maxWidth={760}>
      <VaultClient />
    </PageFrame>
  );
}
