import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "AXIOM — Compute First. Explain Second.",
  description:
    "Adaptive eXplanatory Intelligence via Orthogonal Modeling. Deterministic STEM decomposer + AI narrative adapter. RadhikaChain ecosystem.",
  keywords: ["STEM", "education", "AI tutor", "RadhikaChain", "combinatorics", "genetics"],
  openGraph: {
    title: "AXIOM STEM Tutor",
    description: "Compute first. Explain second.",
    siteName: "RADHIKATMOSPHERE",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans antialiased relative">{children}</body>
    </html>
  );
}