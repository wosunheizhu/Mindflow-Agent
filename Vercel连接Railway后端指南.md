# 🔗 Vercel 连接 Railway 后端完整指南

## ✅ 当前状态

- ✅ Vercel 前端已部署成功
- ✅ Railway Python后端已部署成功
- ⏳ 需要配置连接

---

## 🎯 第一步：获取 Railway 后端域名

### 1.1 访问 Railway Dashboard

```
https://railway.app/dashboard
```

### 1.2 进入您的项目

找到并点击您的 Mindflow-Agent 项目

### 1.3 生成域名（如果还没有）

1. 点击 **Settings** 标签
2. 滚动到 **Networking** 部分
3. 点击 **Generate Domain** 按钮
4. 复制生成的域名，格式类似：
   ```
   https://mindflow-agent-production-xxxx.up.railway.app
   ```

### 1.4 测试 Railway 后端（可选）

在浏览器或终端测试：

```bash
# 测试健康检查
curl https://your-railway-domain.railway.app

# 应该返回服务器响应
```

**保存这个 Railway 域名！** 下一步需要用到。

---

## 🌐 第二步：在 Vercel 配置环境变量

### 2.1 访问 Vercel Dashboard

```
https://vercel.com/dashboard
```

### 2.2 进入您的项目

找到并点击您的 Mindflow-Agent 项目

### 2.3 打开环境变量设置

1. 点击顶部的 **Settings** 标签
2. 左侧菜单点击 **Environment Variables**

### 2.4 添加/更新环境变量

#### 必需的环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VOICE_SERVER_URL` | `https://your-railway-domain.railway.app` | **重要！** Railway后端地址 |
| `OPENAI_API_KEY` | `sk-proj-你的密钥` | OpenAI API |
| `BRAVE_API_KEY` | `你的密钥` | Brave Search API |

#### 可选的环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ARK_API_KEY` | `你的密钥` | 豆包API（用于某些功能） |
| `ANTHROPIC_API_KEY` | `sk-ant-你的密钥` | Claude API |

### 2.5 设置环境变量

对于每个变量：

1. 在 **Key** 框中输入变量名（如 `VOICE_SERVER_URL`）
2. 在 **Value** 框中输入值（如 Railway域名）
3. **重要**：勾选所有环境：
   - ☑️ **Production**
   - ☑️ **Preview**
   - ☑️ **Development**
4. 点击 **Save**

**示例**：
```
Key:   VOICE_SERVER_URL
Value: https://mindflow-agent-production-abcd.up.railway.app
Environments: ☑ Production ☑ Preview ☑ Development
```

### 2.6 验证已添加的变量

确认以下变量都已添加：
- ✅ OPENAI_API_KEY
- ✅ BRAVE_API_KEY
- ✅ VOICE_SERVER_URL ⭐ **最重要**

---

## 🔄 第三步：重新部署 Vercel

环境变量更改后，需要重新部署才能生效。

### 方法1：自动重新部署（推荐）

1. 在项目根目录，提交一个小改动：
```bash
cd /Users/juntinghua/Desktop/agent
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

Vercel会自动检测并重新部署。

### 方法2：手动重新部署

1. 在 Vercel Dashboard 中
2. 点击 **Deployments** 标签
3. 找到最新的部署
4. 点击右侧的 **⋯** (三个点)
5. 选择 **Redeploy**
6. 点击 **Redeploy** 确认

### 方法3：使用 Vercel CLI

```bash
# 安装 Vercel CLI（如果没有）
npm i -g vercel

# 重新部署
vercel --prod
```

---

## ✅ 第四步：测试连接

### 4.1 访问您的 Vercel 应用

```
https://your-app.vercel.app
```

### 4.2 测试基本功能

1. **AI 对话测试**
   - 点击"智能对话"
   - 输入：`你好`
   - ✅ 应该得到 AI 回复

2. **工具调用测试**
   - 输入：`计算 123 × 456`
   - ✅ 应该返回：56088

3. **搜索功能测试**
   - 输入：`搜索 Next.js 15 新特性`
   - ✅ 应该返回搜索结果

### 4.3 测试语音功能（需要 Railway 连接）

1. **点击左侧数字员工卡片**
2. **选择音色**（小岚或小远）
3. **点击语音按钮**
4. **说话测试**

如果语音功能正常：
- ✅ VOICE_SERVER_URL 配置正确
- ✅ Railway 后端连接成功

如果语音功能报错：
- ❌ 检查 VOICE_SERVER_URL 是否正确
- ❌ 检查 Railway 服务是否运行
- ❌ 查看浏览器控制台错误

---

## 🐛 常见问题排查

### 问题1：语音功能404错误

**原因**：`VOICE_SERVER_URL` 未设置或错误

**解决**：
1. 检查 Vercel 环境变量中的 `VOICE_SERVER_URL`
2. 确认值是完整的 Railway URL（包括 https://）
3. 重新部署 Vercel

### 问题2：语音功能CORS错误

**原因**：Railway 后端不允许 Vercel 域名

**解决**：
在 Railway 环境变量中添加：
```
FRONTEND_URL=https://your-app.vercel.app
```

### 问题3：AI对话不工作

**原因**：`OPENAI_API_KEY` 或 `BRAVE_API_KEY` 未设置

**解决**：
1. 检查 Vercel 环境变量
2. 确认 API 密钥有效
3. 重新部署

### 问题4：环境变量不生效

**原因**：添加环境变量后没有重新部署

**解决**：
- 手动触发 Redeploy
- 或推送一个新提交触发自动部署

---

## 🔍 验证连接状态

### 查看 Vercel Function Logs

1. Vercel Dashboard → 项目
2. **Deployments** 标签
3. 点击最新部署
4. 选择 **Functions** 标签
5. 查看 `/api/chat` 的日志

**正常日志**：
```
POST /api/chat 200
```

**错误日志**：
```
Error: VOICE_SERVER_URL is not defined
或
Error: Failed to fetch from Railway
```

### 查看 Railway Logs

1. Railway Dashboard → 项目
2. **Deployments** 标签
3. 点击 **View Logs**

**正常日志**：
```
INFO: Uvicorn running on http://0.0.0.0:8001
INFO: 127.0.0.1 - "POST /api/avatar-chat-stream HTTP/1.1" 200
```

---

## 📊 完整配置检查清单

### Vercel 环境变量

- [ ] `OPENAI_API_KEY` - 已设置 ✓
- [ ] `BRAVE_API_KEY` - 已设置 ✓
- [ ] `VOICE_SERVER_URL` - 已设置 ✓
- [ ] 所有变量都勾选了 Production/Preview/Development ✓
- [ ] 重新部署已完成 ✓

### Railway 环境变量

- [ ] `ARK_API_KEY` - 已设置 ✓
- [ ] `PYTHONUNBUFFERED=1` - 已设置 ✓
- [ ] `FRONTEND_URL` - 已设置（Vercel域名）✓
- [ ] 服务正常运行 ✓
- [ ] 域名已生成 ✓

### 功能测试

- [ ] AI 对话正常 ✓
- [ ] 工具调用正常 ✓
- [ ] 搜索功能正常 ✓
- [ ] 语音识别正常 ✓
- [ ] 语音合成正常 ✓

---

## 🎉 部署完成架构

```
┌─────────────────────────────────────────┐
│  用户浏览器                              │
│  https://your-app.vercel.app            │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  Vercel (前端)                           │
│  • Next.js 应用                          │
│  • AI 对话 API                           │
│  • 工具调用                              │
└───────────────┬─────────────────────────┘
                ↓ 语音API调用
         VOICE_SERVER_URL
                ↓
┌─────────────────────────────────────────┐
│  Railway (后端)                          │
│  • 语音识别 (ASR)                        │
│  • 语音合成 (TTS)                        │
│  • 数字员工服务                          │
│  https://your-app.railway.app           │
└─────────────────────────────────────────┘
```

---

## 🚀 快速配置命令

### 一键重新部署 Vercel

```bash
cd /Users/juntinghua/Desktop/agent
git commit --allow-empty -m "配置Railway后端连接"
git push origin main
```

Vercel 会在 1-2 分钟内自动重新部署。

---

## 📚 相关文档

- 📖 [完整部署指南](RAILWAY-VERCEL-部署指南.md)
- 🚀 [快速部署步骤](快速部署步骤.md)
- ✅ [部署检查清单](DEPLOYMENT-CHECKLIST.txt)

---

## 💡 关键要点

1. **VOICE_SERVER_URL 最重要**
   - 必须是完整的 Railway URL
   - 包含 `https://`
   - 不要有结尾斜杠

2. **环境变量必须勾选所有环境**
   - Production
   - Preview
   - Development

3. **更改环境变量后必须重新部署**
   - 自动：推送新提交
   - 手动：Vercel Dashboard → Redeploy

---

**配置完成后，您的应用就完全上线了！** 🎊

有任何问题随时告诉我！

