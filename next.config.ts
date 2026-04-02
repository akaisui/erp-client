import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  
  // Add rewrites to proxy images from backend to avoid CORS
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/uploads/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
