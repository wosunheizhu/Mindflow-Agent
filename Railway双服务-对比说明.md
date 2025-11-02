# Railway 双服务部署 - 对比说明

## 核心区别：不同的 Dockerfile = 不同的服务

虽然两个服务都从同一个 GitHub 仓库部署，但通过**指定不同的 Dockerfile 文件**，Railway 会构建完全不同的容器。

---

## 📋 详细对比

### 服务1：语音服务

| 配置项 | 值 |
|--------|-----|
| **Dockerfile Path** | `Dockerfile` |
| **复制的文件** | `voice_server.py`, `doubao_tts_client.py`, `xfyun_asr_client.py`, `llm_tts_stream.py`, `llm_client.py` |
| **启动命令** | `python voice_server.py` |
| **监听端口** | 8001 |
| **功能** | 数字员工语音合成、TTS、ASR |

**Dockerfile 关键部分**：
```dockerfile
# 复制Python后端文件
COPY voice_server.py .
COPY doubao_tts_client.py .
COPY xfyun_asr_client.py .
COPY llm_tts_stream.py .
COPY llm_client.py .

# 暴露端口
EXPOSE 8001

# 启动命令
CMD ["python", "voice_server.py"]  ← 启动语音服务
```

---

### 服务2：GPT-5 服务

| 配置项 | 值 |
|--------|-----|
| **Dockerfile Path** | `Dockerfile.gpt5` |
| **复制的文件** | `gpt5_service.py` |
| **启动命令** | `python gpt5_service.py` |
| **监听端口** | 8002 |
| **功能** | GPT-5 推理、深度思考、流式响应 |

**Dockerfile.gpt5 关键部分**：
```dockerfile
# 复制 GPT-5 服务文件
COPY gpt5_service.py .

# 暴露端口
EXPOSE 8002

# 启动命令
CMD ["python", "gpt5_service.py"]  ← 启动 GPT-5 服务
```

---

## 🎯 为什么不会冲突？

### 1. 不同的 Dockerfile 文件
- 服务1 读取：`Dockerfile`
- 服务2 读取：`Dockerfile.gpt5`
- **Railway 根据文件内容构建不同的容器**

### 2. 不同的启动命令
- 服务1：`CMD ["python", "voice_server.py"]`
- 服务2：`CMD ["python", "gpt5_service.py"]`
- **运行的是完全不同的 Python 程序**

### 3. 不同的端口
- 服务1：8001
- 服务2：8002
- **即使在同一台机器上也不会冲突**

### 4. 不同的依赖文件
- 服务1：复制 5 个 Python 文件（语音相关）
- 服务2：只复制 1 个文件（gpt5_service.py）
- **容器内的文件结构不同**

---

## 🔧 Railway 配置核心要点

### 服务1：语音服务
```
┌─────────────────────────────────────┐
│ Railway Service Settings            │
├─────────────────────────────────────┤
│ Service Name: mindflow-voice-service│
│ Dockerfile Path: Dockerfile    ← 这里│
│ Port: 8001                          │
└─────────────────────────────────────┘
         ↓
   使用 Dockerfile
         ↓
   启动 voice_server.py
         ↓
   语音服务运行在 8001
```

### 服务2：GPT-5 服务
```
┌─────────────────────────────────────┐
│ Railway Service Settings            │
├─────────────────────────────────────┤
│ Service Name: mindflow-gpt5-service │
│ Dockerfile Path: Dockerfile.gpt5 ← 这里│
│ Port: 8002                          │
└─────────────────────────────────────┘
         ↓
   使用 Dockerfile.gpt5
         ↓
   启动 gpt5_service.py
         ↓
   GPT-5 服务运行在 8002
```

---

## ✅ 部署验证方法

部署完成后，可以通过以下方式确认服务正确运行：

### 检查语音服务
```bash
curl https://你的语音服务URL/health
# 期望返回：{"status": "ok"}

# 查看日志
# Railway 控制台 → mindflow-voice-service → Logs
# 应该看到：Uvicorn running on http://0.0.0.0:8001
```

### 检查 GPT-5 服务
```bash
curl https://你的GPT5服务URL/
# 期望返回：FastAPI 响应或 404（正常）

# 查看日志
# Railway 控制台 → mindflow-gpt5-service → Logs
# 应该看到：Uvicorn running on http://0.0.0.0:8002
```

---

## 📊 完整架构图

```
GitHub 仓库: Mindflow-Agent
    │
    ├─────────────────┬─────────────────┐
    ↓                 ↓                 ↓
┌─────────┐    ┌──────────┐     ┌──────────┐
│ Vercel  │    │Railway #1│     │Railway #2│
│  前端   │    │ 语音服务 │     │GPT-5服务 │
└─────────┘    └──────────┘     └──────────┘
    │               │                 │
    │          使用 Dockerfile   使用 Dockerfile.gpt5
    │               ↓                 ↓
    │         voice_server.py    gpt5_service.py
    │          端口 8001          端口 8002
    │               │                 │
    └───────────────┴─────────────────┘
         前端调用两个后端服务
```

---

## 🎓 关键理解

**同一个 GitHub 仓库，多个 Railway 服务**的原理：

1. **仓库代码相同**：所有服务都从同一个仓库拉取代码
2. **Dockerfile 不同**：每个服务指定不同的 Dockerfile
3. **构建过程不同**：Railway 根据 Dockerfile 构建不同的容器
4. **运行程序不同**：每个容器运行不同的 Python 文件
5. **端口不同**：避免冲突
6. **域名不同**：Railway 为每个服务生成独立的域名

---

## ⚠️ 配置时的注意事项

### 最重要的设置：Dockerfile Path

**语音服务**：
```
Settings → Build → Dockerfile Path
输入：Dockerfile
```

**GPT-5 服务**：
```
Settings → Build → Dockerfile Path
输入：Dockerfile.gpt5
```

**如果设置错误**：
- ❌ 两个服务都设置 `Dockerfile` → 都会启动语音服务
- ❌ 两个服务都设置 `Dockerfile.gpt5` → 都会启动 GPT-5 服务
- ✅ 分别设置不同的 Dockerfile → 正确运行不同服务

---

## 🧪 部署后验证服务类型

### 方法1：查看日志输出

**语音服务日志应该显示**：
```
启动语音服务...
TTS客户端初始化完成
Uvicorn running on http://0.0.0.0:8001
```

**GPT-5 服务日志应该显示**：
```
启动 GPT-5 Responses API 代理服务
Uvicorn running on http://0.0.0.0:8002
```

### 方法2：测试 API 端点

```bash
# 语音服务有 /health 端点
curl https://语音服务URL/health
# ✅ 返回：{"status": "ok"}

# GPT-5 服务有不同的端点
curl https://GPT5服务URL/api/responses
# ✅ 返回：需要 POST 请求的错误信息（正常）
```

### 方法3：检查环境变量

**语音服务需要**：
- ARK_API_KEY
- DOUBAO_API_KEY
- XFYUN_* 系列

**GPT-5 服务只需要**：
- OPENAI_API_KEY
- OPENAI_BASE_URL

---

## 📋 配置清单（防止混淆）

### 服务1配置清单
```
✅ Service Name: mindflow-voice-service
✅ Dockerfile Path: Dockerfile（不带 .gpt5）
✅ PORT: 8001
✅ 环境变量：ARK_API_KEY, DOUBAO_API_KEY, XFYUN_*
✅ 启动日志包含："启动语音服务"
```

### 服务2配置清单
```
✅ Service Name: mindflow-gpt5-service
✅ Dockerfile Path: Dockerfile.gpt5（带 .gpt5）
✅ PORT: 8002
✅ 环境变量：OPENAI_API_KEY, OPENAI_BASE_URL
✅ 启动日志包含："启动 GPT-5"
```

---

## 💡 总结

**不会冲突的原因**：
1. ✅ **Dockerfile 文件名不同** → 构建不同的容器
2. ✅ **启动命令不同** → 运行不同的程序
3. ✅ **端口不同** → 8001 vs 8002
4. ✅ **域名不同** → Railway 自动分配独立域名

**只要在 Railway 设置中正确指定 Dockerfile Path，就能部署两个完全独立的服务！** 🎉

---

## 🎯 快速检查命令

部署两个服务后，运行此命令验证：

```bash
echo "=== 检查语音服务 ==="
curl https://你的语音服务URL/health

echo ""
echo "=== 检查 GPT-5 服务 ==="
curl -I https://你的GPT5服务URL/

# 如果两个都返回正常响应，说明部署正确！
```

现在你可以放心部署了！记得在 Railway 配置中仔细检查 **Dockerfile Path** 设置！
