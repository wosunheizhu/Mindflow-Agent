# GPT-5 服务连接 - 紧急修复

## 🔍 问题诊断

从 Railway 日志看，GPT-5 服务已正常运行：
```
INFO: Uvicorn running on http://0.0.0.0:8002
URL: mindflow-agent-production.up.railway.app
```

但前端无法访问，原因是：

**Vercel 前端代码中的配置**：
```typescript
const gpt5ServiceUrl = process.env.GPT5_SERVICE_URL || 'http://localhost:8002';
```

如果 Vercel 环境变量中**没有配置 `GPT5_SERVICE_URL`**，就会使用 `localhost:8002`，这在云端无法访问！

---

## ✅ 解决方案

### 步骤1：获取 Railway GPT-5 服务 URL

从你的截图看，URL 是：
```
mindflow-agent-production.up.railway.app
```

完整 URL 应该是：
```
https://mindflow-agent-production.up.railway.app
```

### 步骤2：在 Vercel 添加环境变量

1. **访问 Vercel 控制台**：https://vercel.com/dashboard
2. **选择项目**：mindflow-agent
3. **Settings** → **Environment Variables**
4. **点击 Add New**

添加以下环境变量：

```
Key: GPT5_SERVICE_URL
Value: https://mindflow-agent-production.up.railway.app

Select Environments:
☑️ Production
☑️ Preview
☑️ Development
```

5. **点击 Save**

### 步骤3：重新部署 Vercel

**重要**：添加环境变量后必须重新部署！

1. **Deployments** 标签
2. 点击最新部署右侧的 **...** 菜单
3. 选择 **Redeploy**
4. 确认并等待完成（约 1-2 分钟）

---

## 🧪 验证连接

### 测试1：检查 Railway 服务

```bash
# 测试 GPT-5 服务是否可访问
curl https://mindflow-agent-production.up.railway.app/

# 期望：返回 FastAPI 的响应（可能是 404 或欢迎页面）
```

### 测试2：在 Vercel 部署后测试

访问你的网站，选择 **Mindflow-Y-Pro** 或 **Mindflow-Y**，发送消息。

**查看浏览器控制台**（F12）：

```
应该看到：
[GPT5-Pro] 调用服务: https://mindflow-agent-production.up.railway.app/api/responses
```

如果还是显示 `localhost:8002`，说明环境变量没生效，需要再次 Redeploy。

---

## 🔍 另一个可能的问题：CORS

如果环境变量配置正确，但仍然失败，可能是 CORS 问题。

### 检查 GPT-5 服务是否允许跨域请求

在 `gpt5_service.py` 中应该有 CORS 配置：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

如果没有，需要添加并重新部署 Railway 服务。

---

## 📊 完整的环境变量配置

### Vercel 应该有的环境变量

```bash
# AI 服务
OPENAI_API_KEY=sk-proj-xxx
OPENAI_BASE_URL=https://api.openai.com/v1

# GPT-5 独立服务（重要！）
GPT5_SERVICE_URL=https://mindflow-agent-production.up.railway.app

# 语音服务（如果已配置）
NEXT_PUBLIC_VOICE_SERVER_URL=https://xxx.up.railway.app

# Vercel Blob
BLOB_READ_WRITE_TOKEN=（自动生成）
```

---

## 🎯 快速检查命令

### 检查环境变量是否生效

部署后，访问你的网站，在浏览器控制台运行：

```javascript
// 发送一个测试请求
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: '测试' }],
    modelProvider: 'gpt5-pro',
    deepThinkingEnabled: true,
    deepThinkingLevel: 'medium'
  })
})
.then(r => r.text())
.then(text => console.log('响应:', text))
.catch(err => console.error('错误:', err));

// 查看 Console 的输出，应该看到：
// [GPT5-Pro] 调用服务: https://mindflow-agent-production.up.railway.app/...
```

---

## 💡 为什么一定要配置环境变量？

代码中的默认值是：
```typescript
const gpt5ServiceUrl = process.env.GPT5_SERVICE_URL || 'http://localhost:8002';
```

- **本地开发**：没有环境变量 → 使用 `localhost:8002` → ✅ 正常（本地服务）
- **Vercel 生产环境**：没有环境变量 → 使用 `localhost:8002` → ❌ 失败（云端没有 localhost）

**必须配置环境变量**指向 Railway 的公网地址！

---

## 🚀 立即操作

1. **复制 Railway URL**：
   ```
   https://mindflow-agent-production.up.railway.app
   ```

2. **在 Vercel 添加环境变量**：
   ```
   GPT5_SERVICE_URL=https://mindflow-agent-production.up.railway.app
   ```

3. **Redeploy Vercel**

4. **测试强推理模型**

---

## 📋 完整检查清单

- [ ] Railway GPT-5 服务运行正常（从截图看已 ✅）
- [ ] Railway 生成了公网域名
- [ ] Vercel 环境变量 `GPT5_SERVICE_URL` 已添加
- [ ] Vercel 已重新部署（应用环境变量）
- [ ] 浏览器清除缓存
- [ ] 测试强推理模型
- [ ] 查看控制台日志确认调用正确的 URL

---

**立即去 Vercel 控制台添加 `GPT5_SERVICE_URL` 环境变量吧！** 🚀

这是导致强推理模型无响应的根本原因！

