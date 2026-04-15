import type { Metadata, Viewport } from "next";
import { PwaProvider } from "@/components/pwa-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Notes App",
  description: "A premium AI-assisted notes workspace with notebooks, search, offline-ready shell support, and installable app behavior.",
  applicationName: "AI Notes App",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Notes App",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f4ede3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaProvider />
        {children}
      </body>
    </html>
  );
}
