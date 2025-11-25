import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only enable static export in production builds
  // In development, we need dynamic routing to work
  ...(process.env.NODE_ENV === "production" && { output: "export" }),
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  // Headers for WASM support (development only, as headers() is incompatible with output: 'export')
  // In production static export, these headers should be set at the server/hosting level
  ...(process.env.NODE_ENV !== "production" && {
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
            { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          ],
        },
        {
          source: "/:path*.wasm",
          headers: [
            { key: "Content-Type", value: "application/wasm" },
            { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;


