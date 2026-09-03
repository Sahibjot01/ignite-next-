import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.rawg.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.api.playstation.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
