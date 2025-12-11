import type { Metadata } from "next";
import "./globals.css";
import { MainNav } from "../components/layout/main-nav";

export const metadata: Metadata = {
  title: "Esport Matcher",
  description: "Matching-Plattform für Semi-Competitive Gamer & Esport-Teams"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-background text-foreground">
        <MainNav />
        <main className="mx-auto max-w-6xl px-4 pb-10 pt-4">
          {children}
        </main>
      </body>
    </html>
  );
}
