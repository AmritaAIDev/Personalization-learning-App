import type { Metadata } from "next";
import { Inter, Urbanist } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JEE AI Competency Engine",
  description: "Adaptive learning powered by AI",
};

import { JourneyProvider } from "@/context/JourneyContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${urbanist.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col font-sans`}>
        <JourneyProvider>
          {children}
        </JourneyProvider>
      </body>
    </html>
  );
}
