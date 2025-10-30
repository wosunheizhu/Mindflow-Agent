# 📋 部署前检查清单

在开始部署前，请逐项检查以下内容：

## ✅ 必须完成项

### 1. 代码准备
- [ ] 所有代码已提交到 Git
- [ ] 移除了所有硬编码的 API 密钥
- [ ] 测试了本地构建 `pnpm run build`
- [ ] 修复了所有 TypeScript 错误

### 2. 环境变量准备
- [ ] 已获取 OpenAI API Key
- [ ] 已获取 Google Search API Key 和 CSE ID
- [ ] 准备好所有必需的 API 密钥

### 3. 账号准备
- [ ] 注册了 Vercel 账号（免费）
- [ ] 注册了 Railway 账号（免费额度足够）
- [ ] GitHub 仓库已创建并推送代码

### 4. 配置文件检查
- [ ] `vercel.json` 已创建 ✅
- [ ] `railway.json` 已创建 ✅
- [ ] `Procfile` 已创建 ✅
- [ ] `next.config.js` 已更新 ✅

## 🔧 可选优化项

- [ ] 配置自定义域名
- [ ] 启用 Vercel Analytics
- [ ] 配置错误监控（Sentry）
- [ ] 设置 CI/CD 自动测试

---

## 📝 部署步骤总览

### 步骤 1: 部署 Python 后端到 Railway
预计时间：10-15分钟

1. 访问 https://railway.app
2. 创建新项目
3. 连接 GitHub 仓库
4. 配置环境变量
5. 等待部署完成
6. 复制生成的 URL

### 步骤 2: 部署 Next.js 到 Vercel
预计时间：10-15分钟

1. 访问 https://vercel.com
2. Import GitHub 仓库
3. 配置环境变量（包括 Railway URL）
4. 开始部署
5. 等待完成

### 步骤 3: 测试验证
预计时间：5-10分钟

1. 访问部署的网站
2. 测试工具工作台
3. 测试 API 接口
4. 验证语音功能

---

## 🚨 常见错误预防

### 错误 1: 构建失败
**原因**: 依赖版本冲突或缺失
**解决**: 
```bash
rm -rf node_modules package-lock.json
pnpm install
pnpm run build
```

### 错误 2: 环境变量未生效
**原因**: 变量名拼写错误或未保存
**解决**: 
- 检查 Vercel Dashboard 中的变量
- 重新部署触发更新

### 错误 3: API 超时
**原因**: 函数执行时间超过限制
**解决**: 
- Vercel Free Plan: 10秒限制
- 需要升级或优化代码

### 错误 4: Railway 服务无法访问
**原因**: PORT 环境变量配置错误
**解决**: 
- 确保 `voice_server.py` 使用 `os.environ.get("PORT", 8000)`

---

## 💰 成本估算

### Vercel
- **免费计划**: 
  - 100GB 带宽/月
  - 6000分钟构建时间/月
  - 无限部署
  - ✅ 对大多数项目足够

### Railway
- **免费计划**: 
  - $5 免费额度/月
  - 512MB RAM
  - 1GB 磁盘
  - ✅ 适合轻量级后端

**预计每月成本**: $0（免费计划足够）

---

## 📊 部署后监控

### Vercel
- Dashboard: https://vercel.com/dashboard
- 查看部署日志、分析数据、性能指标

### Railway
- Dashboard: https://railway.app/dashboard
- 查看应用日志、CPU/内存使用情况

---

## 🎯 下一步行动

1. [ ] 开始部署 Railway（见 DEPLOYMENT-GUIDE.md 第二部分）
2. [ ] 开始部署 Vercel（见 DEPLOYMENT-GUIDE.md 第三部分）
3. [ ] 完成验证测试（见 DEPLOYMENT-GUIDE.md 第四部分）

---

## 💡 提示

- 部署过程中可以随时查看详细指南：`DEPLOYMENT-GUIDE.md`
- 遇到问题先查看"常见问题排查"章节
- Railway 和 Vercel 都支持自动部署，推送代码即可更新

祝部署顺利！🚀

