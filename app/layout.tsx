import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PitajSokrata.com – AI savetnik za donošenje odluka",
  description:
    "Pitaj Sokrata za savet. Konkretni, praktični odgovori koji ti zaista pomažu. Besplatno, 3 razgovora dnevno za neprijavljene korisnike.",
  keywords: [
    "AI savetnik",
    "pomoć pri odluci",
    "savetovanje",
    "Sokrat",
    "AI chat",
    "donošenje odluka",
    "besplatan savet",
    "veštačka inteligencija",
    "online savetnik",
    "pitanja i odgovori",
    "life coach",
    "savetodavni chat",
  ],
  authors: [{ name: "PitajSokrata.com" }],
  creator: "PitajSokrata.com",
  publisher: "PitajSokrata.com",
  openGraph: {
    title: "PitajSokrata.com – AI savetnik za donošenje odluka",
    description:
      "Konkretni, praktični odgovori koji ti zaista pomažu. Pitanja, saveti, podrška – sve na jednom mestu.",
    type: "website",
    locale: "sr_RS",
    siteName: "PitajSokrata.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "PitajSokrata.com – AI savetnik",
    description: "Konkretni, praktični odgovori koji ti zaista pomažu.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
  icon: [
    {
      url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23f59e0b'/><text y='24' font-size='22' text-anchor='middle' x='16' fill='white' font-family='serif' font-weight='bold'>S</text></svg>",
      type: "image/svg+xml",
      sizes: "32x32",
    },
    {
      url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' rx='4' fill='%23f59e0b'/><text y='12.5' font-size='12' text-anchor='middle' x='8' fill='white' font-family='serif' font-weight='bold'>S</text></svg>",
      type: "image/svg+xml",
      sizes: "16x16",
    },
  ],
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