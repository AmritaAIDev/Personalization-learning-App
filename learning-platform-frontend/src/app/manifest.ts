import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JEE AI Competency Engine",
    short_name: "JEE AI",
    description: "Adaptive learning for JEE Main & Advanced — diagnostics, AI tutor, practice, analytics.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbfd",
    theme_color: "#3f6f57",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
