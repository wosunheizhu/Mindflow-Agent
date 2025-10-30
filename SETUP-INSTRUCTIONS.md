# 🎯 快速集成指南

## 📝 集成清单

### ✅ 已完成
- [x] 代码已准备好（tools-updated.ts）

### ⏳ 需要你完成

#### 1. 获取 Google Custom Search API（免费）

**步骤 A: 创建 Google Cloud 项目**
```
1. 访问: https://console.cloud.google.com/
2. 登录 Google 账号
3. 点击 "新建项目"
4. 项目名称: openai-agent
5. 点击 "创建"
```

**步骤 B: 启用 API**
```
1. 在项目中，点击 "启用 API 和服务"
2. 搜索 "Custom Search API"
3. 点击启用
```

**步骤 C: 创建 API 密钥**
```
1. 左侧菜单 > "凭据"
2. 点击 "创建凭据" > "API 密钥"
3. 复制密钥（类似：AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX）
```

**步骤 D: 创建搜索引擎**
```
1. 访问: https://programmablesearchengine.google.com/
2. 点击 "添加"
3. 要搜索的网站: * （星号表示搜索整个网络）
4. 语言: 中文
5. 名称: OpenAI Agent Search
6. 点击 "创建"
7. 复制 "搜索引擎 ID"（类似：a1b2c3d4e5f6g7h8i）
```

---

#### 2. 获取 Judge0 API（免费）

**步骤 A: 注册 RapidAPI**
```
1. 访问: https://rapidapi.com/
2. 注册/登录账号
3. 搜索 "Judge0 CE"
4. 选择免费计划（Basic - Free, 50 requests/day）
5. 点击 "Subscribe to Test"
```

**步骤 B: 获取 API 密钥**
```
1. 在 Judge0 CE 页面
2. 找到 "X-RapidAPI-Key" 
3. 复制密钥（类似：1234567890abcdefghijklmnopqrst）
```

---

#### 3. 安装依赖

在终端执行：
```bash
cd /Users/juntinghua/Desktop/agent
npm install googleapis axios
```

---

#### 4. 配置环境变量

打开 `.env.local` 文件，添加以下内容：

```env
# Google Custom Search
GOOGLE_API_KEY=你的_Google_API_密钥
GOOGLE_CSE_ID=你的_搜索引擎_ID

# Judge0 API
JUDGE0_API_KEY=你的_RapidAPI_密钥
```

**示例**：
```env
GOOGLE_API_KEY=AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567
GOOGLE_CSE_ID=a1b2c3d4e5f6g7h8i
JUDGE0_API_KEY=1234567890abcdefghijklmnopqrst
```

---

#### 5. 替换代码文件

执行以下命令：

```bash
cd /Users/juntinghua/Desktop/agent
cp lib/tools.ts lib/tools-backup.ts
cp lib/tools-updated.ts lib/tools.ts
```

或者手动：
1. 重命名 `lib/tools.ts` 为 `lib/tools-backup.ts`
2. 重命名 `lib/tools-updated.ts` 为 `lib/tools.ts`

---

#### 6. 测试

重启服务器（如果正在运行）：
```bash
# 终端按 Ctrl+C 停止
# 然后重新运行
npm run dev
```

访问 http://localhost:3000

测试命令：
```
"搜索 OpenAI GPT-4 的最新功能"
"用 Python 计算 1 到 100 的和"
```

---

## ❓ 常见问题

### Q1: Google API 配额限制？
A: 免费版每天 100 次请求，足够测试使用。

### Q2: Judge0 API 限制？
A: 免费版每天 50 次请求，适合演示。

### Q3: 如果 API 未配置会怎样？
A: 会自动降级到模拟模式，显示提示信息。

### Q4: 成本问题？
A: 两个 API 都有免费层级，足够日常使用。

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 `.env.local` 文件格式
2. 确认 API 密钥是否正确
3. 查看终端错误信息
4. 检查网络连接

---

## ✅ 完成后

你将拥有：
- ✅ 真实的网页搜索功能
- ✅ 真实的代码执行功能
- ✅ 完整的智能助手体验

开始你的 API 集成之旅吧！ 🚀

