# 🔧 Vercel部署诊断和修复指南

## 🔍 问题诊断

**现状**：
- ✅ 数字员工正常（Railway连接成功）
- ❌ Agent对话不能回复（404错误）
- ✅ 本地环境完全正常

**结论**：问题在Vercel的配置或环境变量

---

## ✅ 完整修复方案

### 修复1：确认Vercel环境变量（最可能的问题）

访问：https://vercel.com/dashboard → 项目 → Settings → Environment Variables

**必须有这4个变量**：

#### 1. OPENAI_API_KEY ⭐
```
值: sk-proj-你的实际密钥（不是示例值）
环境: ☑ Production ☑ Preview ☑ Development
```

#### 2. BRAVE_API_KEY
```
值: 你的实际Brave密钥
环境: ☑ Production ☑ Preview ☑ Development
```

#### 3. VOICE_SERVER_URL
```
值: https://web-production-7bbc1.up.railway.app
环境: ☑ Production ☑ Preview ☑ Development
```

#### 4. NEXT_PUBLIC_VOICE_SERVER_URL
```
值: https://web-production-7bbc1.up.railway.app
环境: ☑ Production ☑ Preview ☑ Development
```

**如果任何一个缺失或值不正确，立即添加/修正！**

---

### 修复2：检查Vercel构建日志

1. Vercel Dashboard → Deployments
2. 点击最新的部署
3. 查看 **Build Logs**

**查找关键信息**：
- ✓ `Compiled successfully` - 构建成功
- ✓ `Route (app) ... /api/chat` - API路由已创建
- ❌ 任何错误信息

---

### 修复3：检查Function配置

在Vercel项目中：
```
Settings → Functions

确认：
• Timeout: 60秒（vercel.json已配置）
• Region: Singapore (sin1)
```

---

### 修复4：清除缓存并重新部署

1. **清除Vercel缓存**
   - Settings → 找到 "Clear Build Cache"
   - 点击清除

2. **重新部署**
   - Deployments → Redeploy

3. **等待3-5分钟**

---

## 🧪 部署完成后的测试步骤

### 步骤1：清除浏览器缓存

**重要！** 必须清除缓存或使用隐身模式：
```
Chrome: Cmd+Shift+N (隐身模式)
或
Cmd+Shift+Delete (清除缓存)
```

### 步骤2：访问应用

```
https://mindflow-agent.com
```

### 步骤3：打开开发者工具

按 **F12** → 切换到 **Network** 标签

### 步骤4：测试对话

在聊天框输入：`你好`

### 步骤5：查看请求

在Network标签中：

**正常情况**：
```
✓ POST /api/chat 200 OK
  Response: AI的回复内容
```

**异常情况**：
```
❌ POST /api/chat 404 Not Found
或
❌ POST /api/chat 500 Internal Server Error
```

点击该请求，查看：
- **Request Headers**: 查看环境
- **Response**: 查看错误信息
- **Console**: 查看错误日志

---

## 🐛 常见问题和解决方案

### 问题1：404 Not Found

**可能原因**：
- API路由没有正确部署
- Vercel路由配置问题

**解决方案**：
1. 检查Vercel构建日志中是否有 `/api/chat`
2. 确认 `app/api/chat/route.ts` 文件存在
3. 重新部署

### 问题2：500 Internal Server Error

**可能原因**：
- OPENAI_API_KEY 未配置或无效
- 依赖包缺失

**解决方案**：
1. 检查Vercel环境变量
2. 查看Function Logs中的错误详情

### 问题3：CORS错误（已解决）

**状态**：数字员工已正常，说明CORS已解决 ✓

---

## 📊 完整检查清单

### Vercel配置检查

- [ ] `OPENAI_API_KEY` 已配置且正确
- [ ] `BRAVE_API_KEY` 已配置且正确
- [ ] `VOICE_SERVER_URL` 已配置
- [ ] `NEXT_PUBLIC_VOICE_SERVER_URL` 已配置
- [ ] 所有变量都勾选了3个环境
- [ ] 构建日志显示成功
- [ ] `/api/chat` 路由存在于构建输出中

### Railway配置检查

- [ ] `ARK_API_KEY` 已配置
- [ ] `PYTHONUNBUFFERED=1` 已配置
- [ ] `FRONTEND_URL` 已配置

### 测试检查

- [ ] 使用隐身模式或清除缓存
- [ ] 打开F12开发者工具
- [ ] 查看Network标签
- [ ] 尝试发送"你好"
- [ ] 查看具体的错误信息

---

## 💡 快速诊断命令

### 在浏览器控制台（Console标签）执行：

```javascript
// 检查环境变量是否生效
console.log('NEXT_PUBLIC_VOICE_SERVER_URL:', process.env.NEXT_PUBLIC_VOICE_SERVER_URL);

// 测试API端点
fetch('/api/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({messages: [{role: 'user', content: '你好'}]})
})
.then(r => console.log('Status:', r.status))
.catch(e => console.error('Error:', e));
```

把输出结果复制给我！

---

## 🎯 最可能的原因

基于经验判断，最可能的原因是：

1. **OPENAI_API_KEY 未配置或无效**（80%可能性）
   - Vercel环境变量中检查是否存在
   - 检查值是否正确（不是示例值）

2. **环境变量未生效**（15%可能性）
   - 添加环境变量后没有重新部署
   - 或缓存问题

3. **API路由配置问题**（5%可能性）
   - vercel.json配置
   - 路由文件缺失

---

## 🚀 立即行动

1. **访问Vercel Dashboard**
2. **检查Environment Variables**
3. **确认OPENAI_API_KEY存在且正确**
4. **如果缺失或错误，立即修正**
5. **点击Redeploy**
6. **等待3-5分钟**
7. **清除浏览器缓存测试**

---

**请先检查Vercel的OPENAI_API_KEY是否配置正确！** 🔑

这是最可能的问题！

