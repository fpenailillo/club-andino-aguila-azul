import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera un build standalone optimizado para Docker/Cloud Run
  output: "standalone",
};

export default nextConfig;
