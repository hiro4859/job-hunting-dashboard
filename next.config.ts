import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Vercel のビルドで ESLint 警告が出ても止めない
    ignoreDuringBuilds: true,
  },
  /* 他の config options があればここに追加 */
};

export default nextConfig;
