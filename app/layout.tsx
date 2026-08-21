import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kanto Pokédex — Red, Blue & Yellow",
  description: "Explore all 151 original Pokémon with sprites, types, stats, abilities and cries.",
  openGraph: {
    title: "Kanto Pokédex — Red, Blue & Yellow",
    description: "Explore all 151 original Pokémon.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Kanto Pokédex — 001 to 151" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kanto Pokédex — Red, Blue & Yellow",
    description: "Explore all 151 original Pokémon.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
