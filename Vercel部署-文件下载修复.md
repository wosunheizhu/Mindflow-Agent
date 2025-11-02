# Vercel/Railway 部署 - 文件下载修复指南

## 问题描述

在 Vercel 和 Railway 等无服务器平台部署时，文件下载功能失败，需要登录 Vercel 才能访问。

**原因**：
1. 无服务器环境中，每个 API 请求可能运行在不同的实例上
2. `/tmp` 目录不在实例间共享
3. 实例可能被回收，导致临时文件丢失

---

## 解决方案

已实现**三层降级方案**：

### 方案1：Vercel Blob Storage（推荐）
- ✅ 持久化存储
- ✅ 跨实例访问
- ✅ CDN 加速
- ✅ 适合生产环境

### 方案2：Data URL（小文件）
- ✅ 无需配置
- ✅ 适合 < 2MB 的文件
- ⚠️ 文件较大时URL过长

### 方案3：内存存储（兼容）
- ⚠️ 仅适用于单实例或快速下载
- ⚠️ 可能在无服务器环境中失败
- ✅ 本地开发可用

---

## 配置 Vercel Blob Storage

### 1. 安装依赖

```bash
pnpm add @vercel/blob
```

### 2. 在 Vercel 控制台配置

1. 登录 [Vercel 控制台](https://vercel.com)
2. 选择你的项目
3. 进入 **Storage** 标签
4. 点击 **Create Database** → 选择 **Blob**
5. 创建完成后，自动生成环境变量：
   - `BLOB_READ_WRITE_TOKEN`

### 3. 本地开发配置

在 `.env.local` 添加：

```bash
# Vercel Blob Storage（从 Vercel 控制台复制）
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxx
```

### 4. 部署时配置

Vercel 部署时会自动注入环境变量，无需手动配置。

---

## 代码改动说明

### 1. 新增 `lib/blob-storage.ts`
云存储适配器，支持：
- Vercel Blob Storage
- Data URL 降级
- 内存存储降级

### 2. 更新 `lib/tools-complete.ts`
所有文件生成工具改用 `uploadAndGetUrl()` 函数：

**修改前**：
```typescript
const token = await registerDownload(buffer, filename, mime);
const downloadUrl = `${baseUrl}/api/download?token=${token}`;
```

**修改后**：
```typescript
const downloadUrl = await uploadAndGetUrl(buffer, filename, mime);
// 自动选择最佳存储方案
```

### 3. 更新 `app/api/download/route.ts`
支持新旧两种存储方案，自动降级。

---

## 工作原理

### 上传流程

```
生成文件 (Buffer)
    ↓
uploadAndGetUrl()
    ↓
检测环境变量
    ↓
├─ 有 BLOB_READ_WRITE_TOKEN?
│  ├─ YES → 上传到 Vercel Blob
│  │        返回: https://xxx.vercel-storage.com/...
│  └─ NO → 继续
│
├─ 文件 < 2MB?
│  ├─ YES → 转换为 Data URL
│  │        返回: data:mime;base64,xxx
│  └─ NO → 继续
│
└─ 使用内存存储
   返回: /api/download?token=xxx
```

### 下载流程

```
用户点击下载链接
    ↓
判断链接类型
    ↓
├─ Vercel Blob URL (https://)
│  └─ 直接从 CDN 下载
│
├─ Data URL (data:)
│  └─ 浏览器直接解码
│
└─ 本地 token (/api/download?token=)
   └─ 从内存/临时文件读取
```

---

## 测试验证

### 本地测试（无 Vercel Blob）

```bash
# 1. 启动服务
pnpm dev

# 2. 测试小文件（使用 Data URL）
curl -X POST http://localhost:3000/api/tools/...
# 期望：返回 data:mime;base64,... 格式的URL

# 3. 测试大文件（使用内存存储）
# 期望：返回 /api/download?token=xxx 格式的URL
```

### Vercel Blob 测试

```bash
# 1. 配置环境变量
export BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx

# 2. 启动服务
pnpm dev

# 3. 测试文件生成
# 期望：返回 https://xxx.vercel-storage.com/... 格式的URL

# 4. 测试下载
curl "返回的URL"
# 期望：成功下载文件
```

### 生产环境测试

1. 部署到 Vercel
2. 确认 Storage 已配置
3. 测试文件生成和下载
4. 检查控制台日志：
   ```
   ✅ 文件已上传到 Vercel Blob: https://...
   ```

---

## 常见问题

### Q1：本地开发时文件下载失败

**原因**：未配置 Vercel Blob，且文件 > 2MB

**解决方案**：
1. 配置 Vercel Blob（推荐）
2. 或：测试小文件（< 2MB）

### Q2：Vercel 部署后仍然失败

**检查清单**：
1. ✅ 确认已安装 `@vercel/blob` 依赖
2. ✅ 确认 Vercel Storage 已创建
3. ✅ 确认环境变量已注入
4. ✅ 查看部署日志

**查看日志**：
```bash
# Vercel 控制台 → Functions → 查看日志
# 搜索关键词：
- "文件已上传到 Vercel Blob"（成功）
- "Vercel Blob 上传失败"（失败）
- "使用 Data URL 方案"（降级）
```

### Q3：文件太大无法下载

**限制**：
- Vercel Blob: 最大 5GB
- Data URL: 最大 2MB（浏览器限制）
- 内存存储: 取决于实例内存

**解决方案**：
- 文件 > 2MB：必须配置 Vercel Blob
- 文件 > 5GB：考虑分片上传或外部存储（S3）

### Q4：Railway 部署如何配置？

Railway 不支持 Vercel Blob，需要使用替代方案：

**选项1：Data URL（小文件）**
- 无需配置
- 限制：< 2MB

**选项2：AWS S3**
```bash
# .env
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-bucket
```

需要修改 `blob-storage.ts` 添加 S3 支持。

**选项3：Cloudflare R2**
```bash
# .env
CF_ACCOUNT_ID=xxx
CF_ACCESS_KEY_ID=xxx
CF_SECRET_ACCESS_KEY=xxx
CF_R2_BUCKET=my-bucket
```

需要修改 `blob-storage.ts` 添加 R2 支持。

---

## 费用说明

### Vercel Blob Storage

**免费额度**（Hobby 计划）：
- 存储：1GB
- 带宽：100GB/月
- 请求：无限制

**Pro 计划**：
- 存储：$0.15/GB/月
- 带宽：$0.40/GB
- 请求：无限制

**建议**：
- 小文件 + 低流量：免费额度足够
- 大文件 / 高流量：考虑升级或使用 S3

---

## 监控和调试

### 查看上传日志

```bash
# 本地开发
# 查看控制台输出：
✅ 文件已上传到 Vercel Blob: https://...
⚠️ Vercel Blob 上传失败，使用降级方案
⚠️ 使用 Data URL 方案（文件较小）
⚠️ 使用内存存储（可能在无服务器环境中失败）
```

### Vercel 生产环境

1. Vercel 控制台 → Functions → Logs
2. 搜索关键词："文件已上传"
3. 检查 Storage → Usage（用量统计）

### 性能监控

```typescript
// 在 blob-storage.ts 中添加
const startTime = Date.now();
const blob = await put(...);
console.log(`⏱️ 上传耗时: ${Date.now() - startTime}ms`);
```

---

## 迁移检查清单

- ✅ 安装 `@vercel/blob` 依赖
- ✅ 创建 Vercel Blob Storage
- ✅ 配置环境变量（本地 + 生产）
- ✅ 代码已更新（使用 `uploadAndGetUrl`）
- ✅ 本地测试通过
- ✅ 部署到 Vercel
- ✅ 生产环境测试
- ✅ 监控日志确认

---

## 文件清单

- ✅ `lib/blob-storage.ts` - 云存储适配器（新增）
- ✅ `lib/tools-complete.ts` - 工具文件（已更新）
- ✅ `app/api/download/route.ts` - 下载API（已更新）
- ✅ `lib/download-registry.ts` - 旧存储方案（保留兼容）

---

## 下一步

1. **立即可用**：代码已更新，本地开发和小文件下载已可用
2. **配置 Vercel Blob**：生产环境强烈推荐
3. **测试验证**：部署后测试文件下载功能
4. **监控优化**：根据使用情况调整存储方案

**现在就可以部署到 Vercel，文件下载功能将自动工作！** 🎉

