import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Timelines World — The chronology of everything",
  description: "Browse timelines for people, places, events, inventions, disasters and more. Simple. Free. Forever.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}