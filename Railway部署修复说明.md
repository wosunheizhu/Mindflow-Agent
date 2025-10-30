# 🔧 Railway 部署问题已修复

## ❌ 问题原因

Railway的Nixpacks自动检测到了`package.json`文件，错误地将项目识别为**Node.js项目**，并尝试运行`npm ci`来安装依赖。

但实际上：
- **Vercel** 应该部署：Next.js前端（需要Node.js）
- **Railway** 应该部署：Python语音服务后端（只需要Python）

## ✅ 已修复

我已经添加了3个配置文件来明确告诉Railway这是一个Python项目：

### 1. `.railwayignore` (新建)
```
# 忽略所有前端文件
package.json
node_modules/
app/
components/
lib/
*.tsx
*.jsx
```

### 2. `railway.json` (已更新)
```json
{
  "build": {
    "builder": "NIXPACKS",
    "nixpacksPlan": {
      "phases": {
        "setup": {
          "nixPkgs": ["python39", "pip"]
        },
        "install": {
          "cmds": ["pip install -r requirements.txt"]
        }
      }
    }
  },
  "deploy": {
    "startCommand": "python voice_server.py"
  }
}
```

### 3. `nixpacks.toml` (新建)
```toml
[phases.setup]
nixPkgs = ["python39", "pip"]

[phases.install]
cmds = ["pip install -r requirements.txt"]

[start]
cmd = "python voice_server.py"
```

## 🚀 重新部署到Railway

代码已经推送到GitHub，现在有两种方式重新部署：

### 方法1：自动重新部署（推荐）

Railway会自动检测到GitHub的新提交，并触发重新部署。

**查看状态**：
1. 访问 Railway Dashboard
2. 选择您的项目
3. 查看 **"Deployments"** 标签
4. 应该会看到新的部署正在进行

### 方法2：手动触发重新部署

如果没有自动触发：

1. 进入 Railway Dashboard
2. 选择项目
3. 点击右上角的 **"Deploy"** 按钮
4. 或者点击 **"Settings"** → **"Redeploy"**

## ✅ 预期结果

重新部署后，Railway应该：

```bash
╔══════════ Nixpacks v1.38.0 ═════════╗
║ setup      │ python39, pip          ║
║─────────────────────────────────────║
║ install    │ pip install -r ...     ║
║─────────────────────────────────────║
║ start      │ python voice_server.py ║
╚═════════════════════════════════════╝
```

**构建日志应该显示**：
```
✓ Installing Python dependencies...
✓ Starting voice server...
INFO: Uvicorn running on http://0.0.0.0:8001
```

## 🔍 验证部署

部署成功后：

1. **获取Railway域名**
   - Settings → Networking → Generate Domain
   - 复制类似：`https://mindflow-agent-production-xxxx.up.railway.app`

2. **测试端点**
   ```bash
   curl https://your-app.railway.app/health
   ```

3. **保存Railway URL**
   - 在Vercel环境变量中设置：
   ```bash
   VOICE_SERVER_URL=https://your-app.railway.app
   ```

## 📊 部署时间线

```
✓ 推送代码到GitHub          [完成]
⏳ Railway自动检测更新      [等待中]
⏳ 使用Python配置重新构建   [等待中]
⏳ 部署Python后端           [等待中]
⏳ 生成Railway域名          [等待中]
```

预计总时间：3-5分钟

## 🐛 如果还有问题

### 问题：Railway仍然尝试安装Node.js

**解决方案1**：删除并重新创建Railway项目
1. 删除当前Railway项目
2. 创建新项目
3. 从GitHub重新导入

**解决方案2**：使用Docker部署
创建`Dockerfile`：
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY voice_server.py .
COPY doubao_tts_client.py .
COPY xfyun_asr_client.py .
COPY llm_tts_stream.py .

CMD ["python", "voice_server.py"]
```

### 问题：依赖安装失败

检查`requirements.txt`是否正确：
```bash
fastapi==0.115.5
uvicorn[standard]==0.32.1
websockets==13.1
loguru==0.7.3
python-dotenv==1.0.1
pydantic==2.10.3
aiohttp==3.11.10
pydub==0.25.1
```

## 📝 环境变量设置

别忘了在Railway设置环境变量：

```bash
# 必需
ARK_API_KEY=你的豆包API密钥
PYTHONUNBUFFERED=1

# 可选
OPENAI_API_KEY=你的OpenAI密钥
FRONTEND_URL=你的Vercel域名
```

---

## 🎯 完整部署流程

1. ✅ **Railway（Python后端）**
   - 代码：已推送
   - 配置：已修复
   - 状态：等待重新部署

2. ⏳ **Vercel（Next.js前端）**
   - 等Railway部署完成获取URL
   - 在Vercel设置`VOICE_SERVER_URL`
   - 部署前端

---

**更新时间**: 2025-10-30  
**状态**: 配置已修复，等待Railway重新部署

🚀 Railway应该会在几分钟内自动开始重新部署！

