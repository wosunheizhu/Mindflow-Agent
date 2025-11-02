# Railway 配置 - 不使用 JSON 文件

## ✅ 问题已解决

已将 `railway.json` 和 `railway.gpt5.json` 重命名为备份文件：
- `railway.json` → `railway.voice.json.backup`
- `railway.gpt5.json` → `railway.gpt5.json.backup`

现在可以在 Railway 控制台自由配置 Dockerfile 路径了！

---

## 🚂 Railway 控制台配置步骤

### 服务1：语音服务

#### 1. 进入服务设置

1. 访问 Railway 控制台：https://railway.app/dashboard
2. 选择你的项目
3. 点击 **Mindflow-Agent**（语音服务）
4. 点击 **Settings** 标签

#### 2. 配置 Build 设置

找到 **Build** 部分，设置：

```
Builder: Dockerfile
Dockerfile Path: Dockerfile
Root Directory: /
```

#### 3. 保存并重新部署

1. 点击页面底部的 **Save**（如果有）
2. 返回服务主页
3. 点击右上角的 **Deploy** → **Redeploy**

---

### 服务2：GPT-5 服务

#### 1. 进入服务设置

1. 在同一个 Railway 项目中
2. 点击 **GPT-5 服务**（如果已创建）
3. 点击 **Settings** 标签

#### 2. 配置 Build 设置（关键）

找到 **Build** 部分，设置：

```
Builder: Dockerfile
Dockerfile Path: Dockerfile.gpt5  ← 重点！不同于语音服务
Root Directory: /
```

#### 3. 保存并重新部署

1. 点击 **Save**
2. 返回服务主页
3. 点击 **Deploy** → **Redeploy**

---

## 🔍 验证配置

### 检查语音服务

部署完成后，查看 **Logs**，应该显示：

```
🔄 复制Python后端文件
COPY voice_server.py .
...
启动语音服务...
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### 检查 GPT-5 服务

部署完成后，查看 **Logs**，应该显示：

```
🔄 复制 GPT-5 服务文件
COPY gpt5_service.py .
...
启动 GPT-5 Responses API 代理服务
INFO:     Uvicorn running on http://0.0.0.0:8002
```

---

## 📊 配置对比

| 配置项 | 语音服务 | GPT-5 服务 |
|--------|---------|-----------|
| **Service Name** | mindflow-voice-service | mindflow-gpt5-service |
| **Builder** | Dockerfile | Dockerfile |
| **Dockerfile Path** | `Dockerfile` | `Dockerfile.gpt5` |
| **Port** | 8001 | 8002 |
| **启动日志** | "启动语音服务" | "启动 GPT-5" |

---

## 🎯 为什么要删除 railway.json？

### 问题

当仓库中存在 `railway.json` 时：
- ❌ Railway 会优先使用文件中的配置
- ❌ 界面上的设置会被忽略
- ❌ 所有服务都会使用相同的 Dockerfile

### 解决方案

删除或重命名 `railway.json`：
- ✅ Railway 只使用控制台配置
- ✅ 每个服务可以独立配置
- ✅ 更灵活

---

## 🧪 部署后验证

### 验证1：检查运行的程序

```bash
# 语音服务健康检查
curl https://你的语音服务URL/health
# 期望：{"status": "ok"}

# GPT-5 服务检查
curl https://你的GPT5服务URL/
# 期望：FastAPI 响应页面
```

### 验证2：查看进程和端口

在 Railway Logs 中搜索：

**语音服务**：
```
Uvicorn running on http://0.0.0.0:8001
```

**GPT-5 服务**：
```
Uvicorn running on http://0.0.0.0:8002
```

如果端口不同，说明配置正确！

---

## 💡 最佳实践

### Railway 多服务配置建议

对于多服务部署：
1. ✅ **不要使用** `railway.json` 文件
2. ✅ **在控制台单独配置**每个服务
3. ✅ **使用环境变量**区分服务
4. ✅ **查看日志**确认服务类型

### 配置文件管理

```
项目结构：
├── Dockerfile              # 语音服务的 Dockerfile
├── Dockerfile.gpt5         # GPT-5 服务的 Dockerfile
├── railway.*.backup        # 备份文件（不会被 Railway 读取）
└── （无 railway.json）     # 不使用配置文件
```

---

## 🔄 当前状态

- ✅ railway.json 已重命名为备份
- ✅ 代码已推送到 GitHub
- ✅ Vercel 正在自动部署（包含 PDF/Word 支持）
- ⏳ 需要在 Railway 控制台手动配置 Dockerfile Path

---

## 🎯 下一步操作

### 1. 配置语音服务

```
Railway 控制台 → 语音服务 → Settings → Build
→ Dockerfile Path: Dockerfile
→ Save → Redeploy
```

### 2. 配置 GPT-5 服务

```
Railway 控制台 → GPT-5 服务 → Settings → Build
→ Dockerfile Path: Dockerfile.gpt5
→ Save → Redeploy
```

### 3. 等待 Vercel 部署完成

访问 https://vercel.com/dashboard 查看部署状态

### 4. 测试完整功能

- ✅ 数字员工现在会正确发送提示词
- ✅ 可以生成 Word 文档
- ✅ 可以生成 PDF 文档
- ✅ 可以生成图表
- ✅ 下载链接正确显示

---

**现在去 Railway 控制台配置两个服务的 Dockerfile Path 吧！** 🚀

配置完成后，所有服务就都正常了！

