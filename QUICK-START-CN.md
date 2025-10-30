# 🚀 5 分钟快速集成指南

## 第一步：安装依赖 ✅
```bash
npm install googleapis axios
```
**状态**: ✅ 已完成

---

## 第二步：获取 API 密钥 ⏳

### A. Google Custom Search（2分钟）

#### 🔑 获取 Google API 密钥

1. **打开浏览器访问**：
   ```
   https://console.cloud.google.com/
   ```

2. **创建项目**：
   - 点击顶部项目下拉菜单
   - 选择"新建项目"
   - 项目名称：`openai-agent`
   - 点击"创建"

3. **启用 API**：
   - 左侧菜单 > "API 和服务" > "库"
   - 搜索框输入：`Custom Search API`
   - 点击进入，点击"启用"

4. **创建密钥**：
   - 左侧菜单 > "API 和服务" > "凭据"
   - 点击"创建凭据" > "API 密钥"
   - 复制生成的密钥（以 `AIza` 开头）
   - 保存密钥：`AIzaSy...`

#### 🔍 创建搜索引擎 ID

1. **打开新标签页访问**：
   ```
   https://programmablesearchengine.google.com/
   ```

2. **添加搜索引擎**：
   - 点击"添加"按钮
   - "要搜索的网站"输入：`*`（星号）
   - "语言"选择：中文
   - "搜索引擎名称"：`OpenAI Agent Search`
   - 点击"创建"

3. **获取 ID**：
   - 创建完成后，点击"控制台"
   - 在概览页面找到"搜索引擎 ID"
   - 复制这个 ID（类似：`a1b2c3d4e5f6g7h8i`）
   - 保存 ID：`a1b2c3...`

---

### B. Judge0 API（1分钟）

#### 💻 获取代码执行 API 密钥

1. **注册 RapidAPI**：
   ```
   https://rapidapi.com/
   ```
   - 使用 Google/GitHub 账号快速注册

2. **订阅 Judge0**：
   - 登录后，搜索框输入：`Judge0 CE`
   - 点击 "Judge0 CE" 进入
   - 选择 "Basic" 计划（免费，50次/天）
   - 点击 "Subscribe to Test"

3. **复制密钥**：
   - 在页面中找到 "X-RapidAPI-Key"
   - 复制这个密钥（一串长字符）
   - 保存密钥：`1234567890abcd...`

---

## 第三步：配置环境变量 ⏳

打开文件 `.env.local`，添加以下内容：

```env
# Google Custom Search
GOOGLE_API_KEY=你复制的_Google_API_密钥
GOOGLE_CSE_ID=你复制的_搜索引擎_ID

# Judge0 API
JUDGE0_API_KEY=你复制的_RapidAPI_密钥
```

**示例**（请替换为你的实际密钥）：
```env
GOOGLE_API_KEY=AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567
GOOGLE_CSE_ID=a1b2c3d4e5f6g7h8i
JUDGE0_API_KEY=1234567890abcdefghijklmnopqrstuvwxyz
```

---

## 第四步：更新代码 ⏳

在终端执行：

```bash
cd /Users/juntinghua/Desktop/agent

# 备份原文件
cp lib/tools.ts lib/tools-backup.ts

# 使用新文件
cp lib/tools-updated.ts lib/tools.ts
```

---

## 第五步：重启服务器 ⏳

在终端按 `Ctrl + C` 停止服务器，然后重新启动：

```bash
npm run dev
```

---

## 第六步：测试功能 🎉

访问：`http://localhost:3000`

### 测试网页搜索：
```
搜索 OpenAI GPT-4 的最新功能
```

### 测试代码执行：
```
用 Python 计算 1 到 100 的和并输出结果
```

### 测试综合功能：
```
搜索斐波那契数列的定义，然后用 Python 实现前 10 项
```

---

## ✅ 完成检查清单

- [ ] 获取了 Google API 密钥
- [ ] 获取了 Google 搜索引擎 ID
- [ ] 获取了 Judge0 API 密钥
- [ ] 配置了 `.env.local` 文件
- [ ] 备份了原 `tools.ts` 文件
- [ ] 替换为新的 `tools.ts` 文件
- [ ] 重启了开发服务器
- [ ] 测试了网页搜索功能
- [ ] 测试了代码执行功能

---

## 🎯 快速命令汇总

```bash
# 1. 安装依赖（已完成）
npm install googleapis axios

# 2. 备份并替换代码
cp lib/tools.ts lib/tools-backup.ts
cp lib/tools-updated.ts lib/tools.ts

# 3. 编辑环境变量
# 打开 .env.local 文件，添加上面提到的配置

# 4. 重启服务器
# 按 Ctrl+C 停止，然后执行：
npm run dev
```

---

## ❓ 遇到问题？

### API 未配置提示
如果看到 "⚠️ 未配置 API" 的提示：
- 检查 `.env.local` 文件是否正确配置
- 确认密钥没有多余的空格
- 重启服务器以加载新的环境变量

### 网页搜索失败
- 确认 Google API 已启用
- 检查搜索引擎 ID 是否正确
- 确认没有超过免费配额（100次/天）

### 代码执行失败
- 确认 Judge0 API 订阅成功
- 检查 RapidAPI 密钥是否正确
- 确认没有超过免费配额（50次/天）

---

## 💡 使用技巧

### 优雅降级
如果某个 API 未配置，系统会自动使用模拟数据，不会影响其他功能。

### 配额管理
- Google Search: 100次/天（免费）
- Judge0: 50次/天（免费）
- 足够日常测试和演示使用

### 成本升级
如果需要更高配额：
- Google Search: $5/1000 次请求
- Judge0: $10/月 起（更高配额）

---

**准备好了吗？开始集成吧！** 🚀

