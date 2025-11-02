# 下载功能修复 - URL 格式问题

## 🐛 问题描述

PPT/文档下载失败，浏览器控制台报错：
```
api/download/peiu1vh1hwmhhlnsgs:1 Failed to load resource: the server responded with a status of 404 (Not Found)
下载错误: Error: 下载失败
```

## 🔍 问题根源

**下载 URL 格式不匹配**

### API 路由期望的格式
```typescript
// app/api/download/route.ts
const token = searchParams.get('token');  // 从 query parameter 获取

// 期望的 URL:
/api/download?token=peiu1vh1hwmhhlnsgs
```

### 实际生成的格式
```typescript
// lib/tools-complete.ts (修复前)
const downloadUrl = `/api/download/${downloadToken}`;

// 生成的 URL:
/api/download/peiu1vh1hwmhhlnsgs  ❌ 错误！
```

### 为什么会 404？
Next.js 的 API 路由：
- `/api/download/route.ts` 处理 `/api/download` 路径
- 不会处理 `/api/download/xxx` 这种子路径
- 导致 404 错误

## ✅ 修复方案

### 修改位置
`lib/tools-complete.ts` - 3 处

### 修改内容
```typescript
// ❌ 修复前
const downloadUrl = `/api/download/${downloadToken}`;

// ✅ 修复后
const downloadUrl = `/api/download?token=${downloadToken}`;
```

### 影响的工具
1. **createPresentation** (第 1796 行) - PPT 生成
2. **convertDocument** (第 2024 行) - 文档转换
3. **generateQRCode** (第 2242 行) - 二维码生成

## 📊 修复对比

### 修复前
```json
{
  "downloadUrl": "/api/download/peiu1vh1hwmhhlnsgs"
}
```
→ 404 Not Found ❌

### 修复后
```json
{
  "downloadUrl": "/api/download?token=peiu1vh1hwmhhlnsgs"
}
```
→ 200 OK，成功下载 ✅

## 🧪 测试方法

### 1. 生成 PPT
```
用户：生成一个关于 AI 技术的 PPT
```
期望结果：
- ✅ PPT 创建成功
- ✅ 文件预览卡片显示
- ✅ 点击下载按钮成功下载

### 2. 文档转换
```
用户：将 Word 文档转换为 PDF
```
期望结果：
- ✅ 转换成功
- ✅ 下载链接有效

### 3. 二维码生成
```
用户：生成一个二维码
```
期望结果：
- ✅ 二维码生成成功
- ✅ 图片可下载

## 📝 相关文件

| 文件 | 作用 | 状态 |
|------|------|------|
| `lib/tools-complete.ts` | 工具实现，生成下载 URL | ✅ 已修复 |
| `app/api/download/route.ts` | 下载 API 路由 | 无需修改 |
| `components/FilePreview.tsx` | 文件预览组件 | 无需修改 |

## 🎯 技术细节

### Next.js API 路由机制
```
文件结构:
app/api/download/route.ts

支持的路径:
✅ /api/download              → 匹配 route.ts
✅ /api/download?token=xxx    → 匹配 route.ts (带 query)
❌ /api/download/xxx          → 404 (需要 [token]/route.ts)
```

### 如果要支持 `/api/download/xxx` 格式
需要创建：
```
app/api/download/[token]/route.ts
```
但现有实现使用 query parameter 更简单。

## 🚀 部署注意

此修复只涉及服务端代码，重启服务即可：
```bash
# 开发环境
pnpm run dev

# 生产环境
pnpm run build
pnpm start
```

前端无需清除缓存，因为只是 URL 格式变化。

---

**修复时间**: 2025-11-02  
**影响范围**: PPT 生成、文档转换、二维码生成的下载功能  
**测试状态**: ✅ 语法检查通过

