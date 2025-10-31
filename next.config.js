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

  // 排除不需要打包到serverless function的文件
  outputFileTracingExcludes: {
    '*': [
      '.next/cache/**',
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/**',
    ],
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

