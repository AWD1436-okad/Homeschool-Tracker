import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homeschool Daily Tracker",
  description: "A phone-friendly homeschool daily planner with simple carry-over history.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--app-background)] text-[var(--ink-strong)]">
        {children}
      </body>
    </html>
  );
}
