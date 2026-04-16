import type { Metadata, Viewport } from "next";
import { PwaProvider } from "@/components/pwa-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AINote",
  description: "A premium notes workspace with notebooks, search, offline-ready shell support, and installable app behavior.",
  applicationName: "AINote",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AINote",
  },
  icons: {
    shortcut: [{ url: "/icons/app-icon.svg", type: "image/svg+xml" }],
    icon: [
      { url: "/icons/app-icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem("ainote-theme");
                  if (stored === "light" || stored === "dark") {
                    document.documentElement.setAttribute("data-theme", stored);
                  } else {
                    document.documentElement.removeAttribute("data-theme");
                  }
                } catch (error) {
                  document.documentElement.removeAttribute("data-theme");
                }
              })();
            `,
          }}
        />
        <PwaProvider />
        {children}
      </body>
    </html>
  );
}
