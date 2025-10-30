/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 中 serverActions 已经默认启用，无需配置
  
  // 环境变量
  env: {
    VOICE_SERVER_URL: process.env.VOICE_SERVER_URL,
  },
  
  // 生产环境优化
  swcMinify: true,
  
  // 图片域名白名单
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
}

module.exports = nextConfig

