"use client";

import { useEffect } from "react";

export function PwaProvider() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (error) {
        console.error("[pwa] service worker registration failed", error);
      }
    };

    void register();
  }, []);

  return null;
}
