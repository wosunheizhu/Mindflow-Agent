# 🚀 Vercel 前端部署指南

## ✅ Railway已部署成功！

现在部署Vercel前端，让整个系统上线！

---

## 📋 第一步：获取Railway域名

1. **访问Railway Dashboard**
   ```
   https://railway.app/dashboard
   ```

2. **进入您的项目**

3. **生成公网域名**
   - 点击 **Settings** 标签
   - 找到 **Networking** 部分
   - 点击 **Generate Domain**
   - 复制生成的域名，格式类似：
     ```
     https://mindflow-agent-production-xxxx.up.railway.app
     ```

4. **测试Railway后端**
   ```bash
   curl https://your-railway-domain.railway.app
   ```
   
   应该返回服务器响应，说明Python后端正常运行！

---

## 🌐 第二步：部署Vercel前端

### 2.1 访问Vercel

打开：https://vercel.com/new

### 2.2 导入GitHub仓库

1. 点击 **"Import Git Repository"**
2. 搜索或选择：`wosunheizhu/Mindflow-Agent`
3. 点击 **"Import"**

### 2.3 配置项目

Vercel会自动检测为Next.js项目：

```
Framework Preset: Next.js
Build Command: pnpm run build
Output Directory: .next
Install Command: pnpm install
Root Directory: ./
```

**保持默认设置即可！**

### 2.4 配置环境变量（重要！）

在 **"Environment Variables"** 部分添加以下变量：

#### 必需的环境变量

```bash
# OpenAI API密钥（必需）
OPENAI_API_KEY=sk-proj-你的实际密钥

# Brave Search API密钥（必需）
BRAVE_API_KEY=你的实际密钥

# Railway Python后端地址（必需）
VOICE_SERVER_URL=https://your-railway-domain.railway.app
```

#### 可选的环境变量

```bash
# 豆包API密钥（用于某些功能）
ARK_API_KEY=你的实际密钥

# Claude API密钥（如果使用Claude）
ANTHROPIC_API_KEY=sk-ant-你的实际密钥

# 默认AI提供商
AI_PROVIDER=openai
```

**重要提示**：
- ✅ 每个变量都要勾选：**Production**, **Preview**, **Development**
- ✅ `VOICE_SERVER_URL` 必须是完整的Railway URL
- ✅ 使用真实的API密钥（不是示例值）

### 2.5 开始部署

1. 确认所有配置无误
2. 点击 **"Deploy"** 按钮
3. 等待构建完成（约3-5分钟）

---

## ✅ 第三步：验证部署

### 3.1 访问应用

部署完成后，Vercel会显示您的应用URL：
```
https://mindflow-agent-xxxx.vercel.app
```

点击访问！

### 3.2 测试功能

#### 测试1：基础功能
- ✅ 首页加载正常
- ✅ 看到"Mindflow Agent"标题
- ✅ 侧边栏导航正常

#### 测试2：AI对话
1. 点击左侧 **"智能对话"**
2. 输入简单问题：`你好`
3. ✅ AI正常回复

#### 测试3：计算工具
输入：`计算 123 × 456`
✅ 应该返回：56088

#### 测试4：搜索功能
输入：`搜索 Next.js 15 新特性`
✅ 应该返回搜索结果

#### 测试5：数字员工（如果需要）
1. 点击左侧数字员工卡片
2. 尝试语音输入
3. ✅ 语音识别和合成正常

---

## 🎯 完成！部署架构

```
                    用户浏览器
                         ↓
        ┌────────────────────────────────┐
        │  Vercel (前端)                  │
        │  https://your-app.vercel.app   │
        │  • Next.js 应用                 │
        │  • AI 对话                      │
        │  • 工具调用                     │
        └────────────────────────────────┘
                         ↓
              (语音API调用)
                         ↓
        ┌────────────────────────────────┐
        │  Railway (后端)                 │
        │  https://your-app.railway.app  │
        │  • 语音识别 (ASR)               │
        │  • 语音合成 (TTS)               │
        │  • 数字员工服务                 │
        └────────────────────────────────┘
```

---

## 🔧 常见问题

### Q1: Vercel构建失败

**可能原因**：依赖问题

**解决方案**：
1. 检查Node.js版本是否兼容
2. 查看构建日志找到具体错误
3. 确认`package.json`配置正确

### Q2: 聊天功能不工作

**检查**：
- ✅ `OPENAI_API_KEY` 是否正确设置
- ✅ API密钥是否有效
- ✅ 查看Function Logs中的错误

### Q3: 语音功能不工作

**检查**：
- ✅ `VOICE_SERVER_URL` 是否设置为Railway URL
- ✅ Railway服务是否正常运行
- ✅ `ARK_API_KEY` 是否有效

### Q4: 搜索功能不工作

**检查**：
- ✅ `BRAVE_API_KEY` 是否正确设置
- ✅ Brave Search API配额是否用完

---

## 🔄 后续更新

当您修改代码后：

```bash
# 提交更改
git add .
git commit -m "更新功能"
git push origin main

# 自动触发：
# ✅ Railway 自动重新部署Python后端
# ✅ Vercel 自动重新部署Next.js前端
```

**完全自动化！** 无需手动操作！

---

## 📊 监控和优化

### Vercel Analytics

查看应用性能：
- 访问量统计
- 函数执行时间
- 错误率监控

### Railway Metrics

查看后端状态：
- CPU使用率
- 内存使用量
- 请求响应时间

---

## 🎨 自定义域名（可选）

### 在Vercel添加域名

1. **Settings** → **Domains**
2. 添加您的域名
3. 配置DNS记录
4. 等待验证完成

### 域名配置示例

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## 💰 成本估算

### Vercel免费层
- ✅ 100GB 带宽/月
- ✅ 无限部署
- ✅ 自动HTTPS
- ✅ 全球CDN

### Railway免费层
- ✅ $5 免费额度/月
- ✅ 约500小时运行时间

**预计月成本**：$0-5（个人使用完全够用）

---

## 🎉 恭喜！

您的**Mindflow Agent**已成功部署到生产环境！

### 您现在拥有：

- ✅ 全功能的AI助手平台
- ✅ 21个专业工具
- ✅ AI自主工作流
- ✅ 数字员工系统
- ✅ 完整的前后端分离架构
- ✅ 自动化CI/CD

### 应用地址

**前端**: https://your-app.vercel.app  
**后端**: https://your-app.railway.app

---

## 📚 相关文档

- 📖 [快速部署步骤](快速部署步骤.md)
- 🔧 [Railway部署指南](RAILWAY-VERCEL-部署指南.md)
- 📋 [部署检查清单](DEPLOYMENT-CHECKLIST.txt)
- 🛠️ [工具使用指南](工具清单-完整版.md)

---

## 🚀 开始使用

访问您的应用，开始体验：

1. **智能对话** - 与AI对话
2. **工具中心** - 查看所有工具
3. **工作流** - 创建自动化任务
4. **数字员工** - 语音交互

---

**部署完成时间**: 2025-10-30  
**总部署时间**: 约15分钟  
**状态**: ✅ 生产就绪

🎊 享受您的AI助手平台！🚀

