import type { Metadata } from "next";
import { Suspense } from "react";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import { TopLoader } from "@/components/layout/TopLoader";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nostrarchives.com"),
  title: {
    default: "Nostr Archives — Observe the Social Layer",
    template: "%s · Nostr Archives",
  },
  description:
    "A cinematic explorer for the Nostr network. Track profiles, notes, and trending conversations backed by the nostr-api ingestion pipeline.",
  openGraph: {
    title: "Nostr Archives",
    description:
      "Search the entire Nostr network, monitor trending notes, and dive into any profile with rich analytics.",
    url: "https://nostrarchives.com",
    siteName: "Nostr Archives",
    images: [
      {
        url: "https://nostrarchives.com/og.jpg",
        width: 1200,
        height: 630,
        alt: "Nostr Archives preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nostr Archives",
    description:
      "A cinematic explorer for the Nostr network backed by the nostr-api ingestion stack.",
    creator: "@barrydeen",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-white">
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        <div className="relative isolate overflow-hidden">
          <div className="grid-overlay pointer-events-none absolute inset-0 opacity-60" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,119,206,0.18),transparent_55%)]" />
          <main className="relative z-10 min-h-screen px-4 pb-16 pt-8 sm:px-8 lg:px-16">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
