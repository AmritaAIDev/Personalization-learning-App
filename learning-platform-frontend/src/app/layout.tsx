import type { Metadata } from "next";
import { Urbanist, Poppins } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { AuthProvider } from "@/context/AuthContext";

const urbanist = Urbanist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-urbanist",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "JEE AI Competency Engine",
  description: "Adaptive learning powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${urbanist.variable} ${poppins.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans"
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
