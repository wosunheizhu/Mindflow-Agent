# 🔄 清除缓存指南

如果修改代码后前端没有更新，请按照以下步骤操作：

## 方法 1：硬刷新浏览器（最快）

### Chrome / Edge
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

### Safari
- **Mac**: `Cmd + Option + R`

### Firefox
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

---

## 方法 2：清除浏览器缓存

### Chrome / Edge
1. 按 `Cmd/Ctrl + Shift + Delete`
2. 选择"缓存的图片和文件"
3. 点击"清除数据"
4. 刷新页面

### Safari
1. 菜单：Safari → 清除历史记录
2. 选择"所有历史记录"
3. 点击"清除历史记录"
4. 刷新页面

---

## 方法 3：重启开发服务器

```bash
# 停止开发服务器（如果正在运行）
# 按 Ctrl+C

# 删除 Next.js 缓存
rm -rf .next

# 重新启动
pnpm run dev
```

---

## 方法 4：无痕/隐私模式测试

在浏览器中打开无痕/隐私窗口访问 `http://localhost:3000`

这样可以确保没有使用任何缓存。

---

## ✅ 验证修改

麦克风按钮现在应该：
1. ❌ **不会**请求麦克风权限
2. ✅ **会**弹出"请先登录"的提示框

### 代码位置

已修改的文件：`components/AvatarDisplay.tsx`

```typescript
// 第 322-331 行
const handleMicClick = () => {
  if (isRecording) {
    // 如果正在录音，停止录音
    stopRecording();
  } else {
    // 显示登录提示
    setShowLoginPrompt(true);
  }
};
```

两个麦克风按钮都已更新：
- **展开模式**：第 977 行
- **紧凑模式**：第 1034 行

---

## 💡 常见问题

### Q: 为什么还是开启麦克风？
A: 浏览器缓存了旧版本的 JavaScript，请硬刷新。

### Q: 硬刷新后还是不行？
A: 重启开发服务器并删除 `.next` 文件夹。

### Q: 无痕模式下可以，正常模式不行？
A: 清除浏览器缓存并重启浏览器。

---

## 🎯 快速测试

1. **硬刷新浏览器**：`Cmd/Ctrl + Shift + R`
2. **点击麦克风按钮**
3. **应该看到**："请先登录使用完整功能"弹窗

如果成功，说明修改已生效！✅

