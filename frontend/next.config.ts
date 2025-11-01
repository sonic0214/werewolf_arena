import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用standalone输出模式，用于Docker部署
  output: 'standalone',

  // 配置API URL，在生产环境中将指向后端
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // 配置静态资源
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,

  // 压缩输出
  compress: true,

  // 启用严格模式
  reactStrictMode: true,

  // 启用实验性功能
  experimental: {
    // 启用appDir
    appDir: true,
  },
};

export default nextConfig;
