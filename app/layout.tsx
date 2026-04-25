import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PitajSokrata.com – AI sagovornik",
  description: "Ne dajem savete. Postavljam prava pitanja. Odgovor je već u tebi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" className="dark">
      <body className={`${inter.className} bg-[#0a0a0b] text-gray-100 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}