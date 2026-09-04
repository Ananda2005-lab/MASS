import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG-V2 · AI Agent Platform",
  description: "General-purpose AI agent platform — Chat & Work modes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
