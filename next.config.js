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

  // 排除大包不打包到serverless函数中
  experimental: {
    serverComponentsExternalPackages: ['playwright', 'playwright-core', 'tesseract.js'],
  },

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(process.cwd()),
    };
    
    // 标记为外部依赖，不打包
    if (config.externals) {
      config.externals.push('playwright', 'playwright-core', 'tesseract.js');
    }
    
    return config;
  },
};

module.exports = nextConfig;

