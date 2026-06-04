import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Colly Eventos",
  description: "Sistema de gestão para buffet e casa de eventos",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`h-full ${inter.variable}`}>
      <body className="h-full bg-[#faf8f3] text-[#2a2419] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
