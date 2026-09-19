import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel 300 — Loma Proteção Veicular",
  description: "Central operacional da Equipe 300",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
