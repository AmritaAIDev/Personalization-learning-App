import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { JourneyProvider } from "@/context/JourneyContext";

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
      className="h-full antialiased"
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans"
      >
        <AuthProvider>
          <JourneyProvider>{children}</JourneyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
