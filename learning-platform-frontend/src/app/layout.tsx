import type { Metadata } from "next";
import { Montserrat, Poppins, Urbanist } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
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
      className={`${montserrat.variable} ${poppins.variable} ${urbanist.variable} h-full antialiased`}
    >
      <body className={`${poppins.className} min-h-full flex flex-col font-sans`}>
        <JourneyProvider>
          {children}
        </JourneyProvider>
      </body>
    </html>
  );
}
