# Carbone PPT 生成集成方案

## 📊 当前状态

### Aspose PPT 问题
- ✅ 文件路径问题已修复（使用 /tmp 目录）
- ⚠️ 生成质量不够好（用户反馈）
- ✅ 代码已推送，等待 Vercel 部署

### Carbone 优势
- ✅ 更专业的文档生成
- ✅ 支持循环和条件
- ✅ 模板驱动，输出一致
- ✅ 已有 API Key

---

## 🎯 集成方案

### 方案1：完整集成 Carbone（推荐长期）

**需要的步骤**：

1. **创建通用 ODP 模板**
   - 设计一个通用的演示文稿模板
   - 包含标题页、内容页、总结页等
   - 使用 Carbone 占位符：`{title}`, `{slides[i].title}`, `{slides[i].content}`

2. **上传模板到 Carbone**
   ```bash
   curl -X POST 'https://api.carbone.io/template' \
     -H 'Authorization: Bearer API_KEY' \
     -H 'carbone-version: 4' \
     -F 'template=@template.odp'
   # 获得 templateId
   ```

3. **在代码中使用**
   - 将 templateId 保存为环境变量
   - 调用 Carbone 渲染 API
   - 转换为 PPTX

**优点**：
- ✅ 专业质量
- ✅ 输出一致
- ✅ 支持复杂布局

**缺点**：
- ⚠️ 需要预先设计模板
- ⚠️ 需要一次性配置

---

### 方案2：短期修复 - 先让 Aspose 能用（推荐立即）

**当前情况**：
- ✅ Aspose 文件路径已修复
- ✅ 代码已推送到 GitHub
- ⏳ 等待 Vercel 部署

**立即测试**：
等 Vercel 部署完成后，测试 PPT 生成是否正常工作

如果 Aspose 质量真的不够好，再切换到 Carbone

---

### 方案3：混合方案（平衡）

- **简单 PPT**：使用 Aspose（快速）
- **复杂 PPT**：使用 Carbone（质量高）
- 根据幻灯片数量和复杂度自动选择

---

## 🚀 立即实施：修复并测试 Aspose

### 步骤1：等待 Vercel 部署

当前已推送的修复：
```
fix: 修复 Vercel 环境文件路径问题（PPT/转换/二维码使用 /tmp 目录）
```

等待 Vercel 自动部署完成（约 2 分钟）

### 步骤2：测试 PPT 生成

```
输入："生成一个关于 AI 技术的 PPT"

期望：
✅ AI 调用 create_presentation
✅ 使用 /tmp 目录（不报错）
✅ 生成 .pptx 文件
✅ 返回下载链接
```

### 步骤3：评估质量

下载 PPT 并查看：
- 内容是否完整？
- 格式是否正确？
- 是否有损坏？

**如果质量可接受**：继续使用 Aspose
**如果质量不好**：切换到 Carbone（需要配置模板）

---

## 📋 Carbone 完整集成步骤（如需要）

### 1. 准备模板

创建一个通用的 ODP 模板文件，包含：

**第一页（标题页）**：
```
{presentation.title}
{presentation.subtitle}
```

**内容页（可循环）**：
```
{slides[i].title}
{slides[i].content}
```

### 2. 上传模板

```bash
curl -X POST 'https://api.carbone.io/template' \
  -H 'Authorization: Bearer eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9...' \
  -H 'carbone-version: 4' \
  -F 'template=@general-presentation.odp'
```

获得 `templateId`，例如：`abc123def456`

### 3. 配置环境变量

在 Vercel 和本地 `.env.local` 添加：
```bash
CARBONE_API_KEY=eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9...
CARBONE_TEMPLATE_ID=abc123def456
```

### 4. 实现渲染函数

我已经创建了 `lib/carbone-ppt.ts`，完整实现渲染逻辑

### 5. 替换现有函数

在 `lib/tools-complete.ts` 中，将 `createPresentation` 改为调用 Carbone

---

## 💡 推荐方案

### 立即（今天）

1. ✅ Aspose 路径问题已修复
2. ⏳ 等待 Vercel 部署
3. 🧪 测试 PPT 生成是否能工作
4. 📊 评估生成质量

### 如果质量不满意（明天）

1. 设计通用 ODP 模板
2. 上传到 Carbone 获取 templateId
3. 完整集成 Carbone API
4. 替换 Aspose 实现

---

## 🔧 快速 Carbone 集成代码

我已创建 `lib/carbone-ppt.ts`，包含：
- ✅ API Key 配置
- ✅ 基础渲染函数
- ⚠️ 需要模板 ID 才能使用

**下一步**：
如果决定使用 Carbone，我可以帮你：
1. 创建一个通用的 ODP 模板
2. 上传并获取 templateId
3. 完整集成到工具系统

---

## ⚠️ 当前最紧急的

**不是 PPT 问题，是 GPT-5 连接问题！**

请先修复 Vercel 环境变量：
```
GPT5_SERVICE_URL=https://mindflow-agent-production.up.railway.app
```

加上 `https://` 前缀，然后 Redeploy！

---

**建议：先修复 GPT-5 连接（1分钟），然后等 Vercel 部署完成测试 Aspose PPT 是否能用！** 🚀

