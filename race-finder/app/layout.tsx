import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Race Finder CZ",
  description: "Searchable directory of running races in the Czech Republic",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/" className="brand">
            🏃 Race Finder CZ
          </a>
          <p className="tagline">All running races in the Czech Republic, big and small</p>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
