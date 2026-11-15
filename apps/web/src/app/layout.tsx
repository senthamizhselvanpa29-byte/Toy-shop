import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fredoka, Nunito } from "next/font/google";
import { preconnect } from "react-dom";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Toy Shop",
  description: "Happy toys for happy kids — shop online across India.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // The owner's toy photos come from Supabase storage: start connecting early.
  const photoHost = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (photoHost) preconnect(photoHost);

  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="antialiased">
        {children}
        {/* Real-visitor speed numbers in the Vercel dashboard (only runs on Vercel). */}
        {process.env.VERCEL ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
