# GPT-5 模型诊断步骤

## 问题：配置了 GPT5_SERVICE_URL 但仍无响应

---

## ✅ 已完成的修复

1. ✅ GPT-5 服务端口配置已修复（使用 Railway 标准 PORT 变量）
2. ✅ 代码已推送到 GitHub
3. ✅ UI 对齐问题已修复

---

## 🔍 逐步诊断

### 步骤1：确认 Railway GPT-5 服务已重新部署

**重要**：代码修复后，Railway 必须重新部署！

1. 访问 Railway 控制台：https://railway.app/dashboard
2. 选择 **GPT-5 服务**
3. 查看 **Deployments** 标签
4. 确认最新部署：
   - ✅ 状态：Success
   - ✅ 时间：刚才（几分钟前）
   - ✅ Commit：包含端口修复

**如果部署还是旧的**，手动触发：
- 点击 **Deploy** 或 **Redeploy**
- 等待 2-3 分钟

### 步骤2：检查 Railway 服务日志

1. 在 Railway GPT-5 服务页面
2. 点击 **Logs** 标签
3. 查看最新日志，应该看到：

```
✅ 正确的日志：
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:XXXX

XXXX 应该是 Railway 分配的端口（不是 8002）
```

❌ **如果看到**：
```
INFO:     Uvicorn running on http://0.0.0.0:8002
```

说明还在使用旧代码，需要重新部署！

### 步骤3：测试 Railway 服务

```bash
# 测试服务是否正常响应
curl -X POST https://mindflow-agent-production.up.railway.app/api/responses \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5","input":[{"role":"user","content":"测试"}],"reasoning":{"effort":"medium"}}'

# 期望：返回正常的 JSON 响应
# 如果返回 502：服务还没重新部署或有其他问题
```

### 步骤4：确认 Vercel 环境变量

1. Vercel 控制台 → mindflow-agent → Settings → Environment Variables
2. 确认存在：
   ```
   GPT5_SERVICE_URL=https://mindflow-agent-production.up.railway.app
   ```
3. 确认应用于：✅ Production ✅ Preview ✅ Development

### 步骤5：确认 Vercel 已重新部署

**关键**：添加环境变量后必须 Redeploy！

1. Vercel → Deployments
2. 查看最新部署的时间
3. 如果是环境变量添加**之前**的，必须手动 Redeploy：
   - 点击最新部署 → ... → Redeploy
   - 等待 1-2 分钟

### 步骤6：清除浏览器缓存

1. 关闭所有浏览器标签页
2. 硬刷新：Cmd+Shift+R（Mac）或 Ctrl+Shift+R（Windows）
3. 或完全清除浏览器缓存

### 步骤7：在前端测试并查看日志

1. 访问 Vercel 网站
2. 打开浏览器控制台（F12）
3. 选择 **Mindflow-Y-Pro** 模型
4. 发送一条消息："测试"
5. 在 Console 标签查看：

**应该看到**：
```javascript
🚀 [主聊天] 使用模型: gpt5-pro
[GPT5-Pro] 调用服务: https://mindflow-agent-production.up.railway.app/api/responses
[GPT5-Pro] 请求参数: {...}
```

**如果看到**：
```javascript
[GPT5-Pro] 调用服务: http://localhost:8002/api/responses  // ❌ 错误
```

说明环境变量没生效，需要再次 Redeploy Vercel。

6. 在 Network 标签查看：
   - 找到 `/api/chat` 请求
   - 查看是否有错误响应

---

## 🔧 常见问题和解决方案

### 问题1：Railway 一直返回 502

**原因**：
- 服务未重新部署（还在使用旧代码）
- 或 OpenAI API Key 无效

**解决方案**：
1. 手动触发 Railway Redeploy
2. 检查 Railway 环境变量中的 `OPENAI_API_KEY` 是否正确
3. 查看 Railway 详细日志

### 问题2：Vercel 还在调用 localhost:8002

**原因**：
- 环境变量没生效
- Vercel 没有重新部署

**解决方案**：
1. 确认环境变量已保存
2. **必须 Redeploy Vercel**
3. 清除浏览器缓存

### 问题3：前端显示"AI 正在思考..."但一直没响应

**原因**：
- 请求超时
- Railway 服务响应慢

**解决方案**：
1. 查看浏览器 Console 的错误信息
2. 查看 Network 标签的请求状态
3. 等待更长时间（GPT-5 推理可能需要 10-30 秒）

---

## 📊 完整检查清单

- [ ] Railway GPT-5 服务已重新部署（最新代码）
- [ ] Railway Logs 显示正确的端口（不是固定 8002）
- [ ] Railway 服务测试通过（不返回 502）
- [ ] Vercel 环境变量 `GPT5_SERVICE_URL` 已配置
- [ ] Vercel 已在环境变量配置**之后**重新部署
- [ ] 浏览器缓存已清除
- [ ] 控制台日志显示调用 Railway URL（不是 localhost）
- [ ] 测试成功

---

## 🚀 快速修复脚本

如果上述步骤都完成了还不行，试试这个：

### 1. 手动触发 Railway 重新部署

在 Railway 控制台：
```
GPT-5 服务 → Deployments → Deploy
```

### 2. 等待 Railway 部署完成

查看 Logs，确认：
```
✅ Application startup complete.
✅ Uvicorn running on http://0.0.0.0:XXXX
```

### 3. 测试 Railway 服务

```bash
curl https://mindflow-agent-production.up.railway.app/api/responses \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5","input":[{"role":"user","content":"hi"}],"reasoning":{"effort":"low"}}'
```

如果返回正常 JSON（不是 502），继续下一步。

### 4. Vercel Redeploy

```
Vercel 控制台 → Deployments → 最新部署 → ... → Redeploy
```

### 5. 测试

刷新浏览器（Cmd+Shift+R），测试强推理模型。

---

## 📞 如果仍然失败

提供以下信息以便诊断：

1. **Railway Logs**：最新的启动日志
2. **Vercel 环境变量截图**：确认 `GPT5_SERVICE_URL` 存在
3. **浏览器 Console**：报错信息
4. **浏览器 Network**：`/api/chat` 请求的响应

---

**现在检查 Railway GPT-5 服务是否已重新部署！这是关键！** 🚀

