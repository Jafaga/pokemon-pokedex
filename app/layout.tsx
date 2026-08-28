import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// next/font downloads and self-hosts these files during the Sites build. CSS
// fallbacks in globals.css keep the separate client-only Vercel build portable.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Shared page metadata supplies search snippets, browser icons, and link-preview
// artwork for hosts that render the Next-compatible application shell.
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
  // Font variables are placed on the body so all descendant components can use
  // the same sans-serif and monospace tokens from globals.css.
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
