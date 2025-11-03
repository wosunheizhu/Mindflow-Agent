# Railway 手动部署指南

## 🔍 当前问题

CORS 错误：
```
Access to fetch at 'https://web-production-7bbc1.up.railway.app/api/avatar-chat-stream' 
from origin 'https://mindflow-agent.com' has been blocked by CORS policy
```

**原因**：Railway 语音服务还在运行旧代码（CORS 配置未更新）

---

## ✅ CORS 修复已推送

**代码更新**：
```python
# voice_server.py (已推送)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有域名
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**但 Railway 还没有部署！**

---

## 🚀 立即操作：手动触发 Railway 部署

### 步骤1：访问 Railway 控制台

https://railway.app/dashboard

### 步骤2：选择语音服务

- 项目名：可能是 `web-production-7bbc1`
- 或查找包含 `voice` 的服务

### 步骤3：手动触发部署

1. **点击服务**
2. **点击右上角的 Deploy 按钮**
3. **或进入 Deployments 标签**
4. **点击 Redeploy 或 Deploy**

### 步骤4：等待部署完成

- 查看 Build Logs（约1-2分钟）
- 等待状态变为 **Success**

### 步骤5：查看日志确认

部署完成后，查看 **Deploy Logs**，应该看到：
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:XXXX
```

---

## 🧪 验证 CORS 修复

部署完成后，刷新你的网站并测试：

```
1. 打开小助理对话框
2. 输入任意消息
3. 发送

期望：
✅ 不再显示 CORS 错误
✅ 小助理正常回复
```

---

## 📊 Railway 服务确认

请确认 Railway 中的服务：

### 应该有的服务
1. **语音服务**（voice_server.py）
   - URL: 类似 `xxx-voice.railway.app`
   - 端口: 8001
   
2. **GPT-5 服务**（gpt5_service.py）
   - URL: 类似 `xxx-gpt5.railway.app`
   - 端口: 8002

### 当前访问的 URL
```
web-production-7bbc1.up.railway.app
```

**请确认**：这是语音服务吗？如果是，需要手动部署。

---

## 💡 为什么 Railway 没有自动部署？

可能的原因：
1. Railway 自动部署未启用
2. 需要手动触发
3. 部署失败（检查 Build Logs）

---

## 🎯 快速修复

**最快的方法**：

1. **Railway 控制台** → **选择语音服务**
2. **点击 Deploy 或 Redeploy**
3. **等待 2-3 分钟**
4. **刷新网站测试**

---

**CORS 修复的代码已经推送，只需要 Railway 重新部署即可！** 🚀

