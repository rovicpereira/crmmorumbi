import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM WhatsApp — Morumbi",
  description: "Ferramenta interna de atendimento via WhatsApp da Morumbi Materiais para Construção",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
