import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pronosticuri CM 2026",
  description: "Pronosticuri la Cupa Mondială 2026, între prieteni",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="sticky top-0 z-10 border-b border-black/10 dark:border-white/15 bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              ⚽ Pronosticuri CM 2026
            </Link>
            <nav className="flex gap-4 text-sm font-medium">
              <Link href="/" className="hover:underline">
                Meciuri
              </Link>
              <Link href="/clasament" className="hover:underline">
                Clasament
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-center text-xs text-foreground/50">
          Scor exact = 3 puncte · Rezultat corect = 1 punct · Pronosticurile se blochează la
          începerea meciului
        </footer>
      </body>
    </html>
  );
}
