import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Notes App",
    short_name: "AI Notes",
    description:
      "A premium AI-assisted notes workspace with offline-ready shell support and installable app behavior.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4ede3",
    theme_color: "#f4ede3",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
