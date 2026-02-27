import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Swarm Community Data Platform",
  description: "Privacy-respecting community observability and triage",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-[var(--border)] bg-[var(--card)]">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="font-semibold text-[var(--text)]">
              Swarm CDP
            </Link>
            <nav className="flex gap-6">
              <Link href="/" className="text-[var(--muted)] hover:text-[var(--text)]">
                Home
              </Link>
              <Link href="/inbox" className="text-[var(--muted)] hover:text-[var(--text)]">
                Inbox
              </Link>
              <Link href="/recognition" className="text-[var(--muted)] hover:text-[var(--text)]">
                Recognition
              </Link>
              <Link href="/ecosystem-intel" className="text-[var(--muted)] hover:text-[var(--text)]">
                Ecosystem Intel
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
