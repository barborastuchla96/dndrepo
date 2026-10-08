import "./globals.css";
import type { Metadata } from "next";
import allRaces from "@/data/races.json";

export const metadata: Metadata = {
  title: "Race Finder CZ — Czech running races",
  description: "Searchable directory of running races in the Czech Republic",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const count = (allRaces as unknown[]).length;
  return (
    <html lang="cs">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <a href="/" className="brand">
              <span className="brand-flag">🇨🇿</span>
              Race Finder CZ
            </a>
            <p className="header-stat"><span>{count}</span> races in the database</p>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
