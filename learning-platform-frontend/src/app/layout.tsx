import type { Metadata, Viewport } from "next";
import { Urbanist, Poppins } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

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
  metadataBase: new URL("https://jee-ai.example.com"),
  title: {
    default: "JEE AI Competency Engine — Master Every Concept",
    template: "%s · JEE AI",
  },
  description:
    "Premium adaptive learning for JEE Main & Advanced. Diagnostics, AI tutor, flashcards, practice and analytics — all personalised to your mastery. Built for toppers.",
  applicationName: "JEE AI Competency Engine",
  keywords: ["JEE", "JEE Main", "JEE Advanced", "adaptive learning", "AI tutor", "competency"],
  authors: [{ name: "JEE AI Team" }],
  creator: "JEE AI Competency Engine",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title: "JEE AI Competency Engine — Master Every Concept",
    description:
      "Adaptive diagnostics, Socratic AI tutor, spaced flashcards and targeted practice — crafted for JEE toppers.",
    url: "https://jee-ai.example.com",
    siteName: "JEE AI",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JEE AI Competency Engine",
    description: "Adaptive learning for JEE — diagnostics, AI tutor, practice, analytics.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#121216" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${urbanist.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans"
      >
        <a
          href="#main-content"
          className="sr-only z-[100] m-3 rounded-full bg-ink-solid px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:block"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <div id="main-content" className="flex min-h-full flex-col">
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
