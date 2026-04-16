import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: process.env.TAURI_EXPORT === "1" ? "export" : undefined,
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
