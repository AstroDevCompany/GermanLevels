import type { Metadata } from "next";

export const metadata: Metadata = { title: "Vocabulary" };

export default function VocabularyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
