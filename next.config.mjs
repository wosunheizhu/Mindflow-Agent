/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: false },
  output: 'standalone', // 支持 Docker 独立部署
  env: {
    // 暴露环境变量给客户端（用于前端组件）
    NEXT_PUBLIC_VOICE_SERVER_URL: process.env.VOICE_SERVER_URL,
  },
  webpack: (config, { isServer }) => {
    // 在服务器端构建时，将大型或可选依赖标记为外部依赖
    if (isServer) {
      config.externals = [
        ...(config.externals || []), 
        'playwright',        // 浏览器自动化
        'tesseract.js',      // OCR 文字识别
        'nodemailer',        // 邮件发送
      ];
    }
    return config;
  },
};
export default nextConfig;




