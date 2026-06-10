import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Disable trailingSlash to prevent generating routes as directory index.html files
  // e.g., we want dashboard.html instead of dashboard/index.html because it is cleaner to load in tabs
  trailingSlash: false,
};

export default nextConfig;
