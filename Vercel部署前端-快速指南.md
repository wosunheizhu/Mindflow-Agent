# Vercel 部署前端 - 3 分钟完成

## 为什么推荐 Vercel？

- ✅ Next.js 官方平台，零配置
- ✅ 自动识别，不会混淆前后端
- ✅ 免费额度：100GB 流量/月
- ✅ 全球 CDN，性能最优
- ✅ Railway 继续运行后端

---

## 🚀 快速部署（3 步）

### 步骤 1：访问 Vercel

打开：**https://vercel.com**

点击 **"Sign Up"** 或 **"Login"**

使用 GitHub 账号登录

### 步骤 2：导入项目

1. 点击 **"Add New..."** → **"Project"**
2. 选择您的仓库 `Mindflow-Agent`
3. 点击 **"Import"**

### 步骤 3：配置项目

Vercel 会自动检测到 Next.js，配置如下：

```
Framework Preset: Next.js ✅ (自动检测)
Root Directory: ./ (默认)
Build Command: pnpm build (自动)
Output Directory: .next (自动)
Install Command: pnpm install (自动)
```

**不需要修改任何设置！**

### 步骤 4：添加环境变量

在 **"Environment Variables"** 部分添加：

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
OPENAI_API_KEY=您的Key
ANTHROPIC_API_KEY=您的Key
VOICE_SERVER_URL=https://您的Railway后端地址.railway.app
NEXT_PUBLIC_VOICE_SERVER_URL=https://您的Railway后端地址.railway.app
SERPER_API_KEY=您的Key
JINA_API_KEY=您的Key
ASPOSE_WORDS_CLIENT_ID=您的ID
ASPOSE_WORDS_CLIENT_SECRET=您的Secret
ASPOSE_SLIDES_CLIENT_ID=您的ID
ASPOSE_SLIDES_CLIENT_SECRET=您的Secret
```

### 步骤 5：部署

点击 **"Deploy"**

等待 2-3 分钟，完成！🎉

---

## 🔗 获取后端地址

在 Railway Dashboard 中：
1. 进入您的后端服务
2. 复制 Public Domain
3. 粘贴到 Vercel 的环境变量中

---

## ✅ 完成后

- 前端：`https://your-app.vercel.app`
- 后端：`https://your-backend.railway.app`

完美分离，各司其职！🚀

