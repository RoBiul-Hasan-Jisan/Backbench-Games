import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backbench Games — Pick a Desk. Start a Match.",
  description:
    "The nostalgic multiplayer platform for the games you played on the last bench: Tic Tac Toe, Rock Paper Scissors, and more, online with friends.",
  icons: {
    icon: "/favicon.svg", // Path relative to the public folder
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}