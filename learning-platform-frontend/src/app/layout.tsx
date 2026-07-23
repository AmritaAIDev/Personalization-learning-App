import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { JourneyProvider } from "@/context/JourneyContext";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
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
      className={`${jakarta.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className={`${jakarta.className} min-h-full flex flex-col font-sans`}
      >
        <AuthProvider>
          <JourneyProvider>{children}</JourneyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
