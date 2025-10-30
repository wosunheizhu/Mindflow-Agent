import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: false },
  env: {
    // 暴露环境变量给客户端（用于前端组件）
    NEXT_PUBLIC_VOICE_SERVER_URL: process.env.VOICE_SERVER_URL,
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(process.cwd()),
    };
    return config;
  },
};
export default nextConfig;




