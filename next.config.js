const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 环境变量
  env: {
    VOICE_SERVER_URL: process.env.VOICE_SERVER_URL,
    NEXT_PUBLIC_VOICE_SERVER_URL: process.env.VOICE_SERVER_URL,
  },
  
  // 图片域名白名单
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
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

module.exports = nextConfig;

