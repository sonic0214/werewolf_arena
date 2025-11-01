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
  reactStrictMode: false, // 禁用以避免静态生成错误

  // 启用实验性功能
  experimental: {
    // 禁用严格模式以避免静态生成错误
    optimizeCss: false,
  },

  // 图片配置
  images: {
    unoptimized: true, // 禁用图片优化以避免构建错误
  },
};

export default nextConfig;
