import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PitajSokrata.com – AI sagovornik za donošenje odluka",
  description: "Pitaj Sokrata za savet. Konkretni, praktični odgovori koji ti zaista pomažu. Besplatno, 3 razgovora dnevno.",
  keywords: ["AI savetnik", "pomoć pri odluci", "savetovanje", "Sokrat", "AI chat", "donošenje odluka"],
  openGraph: {
    title: "PitajSokrata.com – AI sagovornik za donošenje odluka",
    description: "Konkretni, praktični odgovori koji ti zaista pomažu.",
    type: "website",
    locale: "sr_RS",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏛️</text></svg>",
  },
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