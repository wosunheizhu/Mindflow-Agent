# 🔧 API 集成详细指南

## 第一部分：Google Custom Search 集成

### 步骤 1: 获取 Google API 密钥

#### 1.1 创建 Google Cloud 项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 登录你的 Google 账号
3. 点击顶部的项目下拉菜单
4. 点击 "新建项目"
5. 输入项目名称（如：openai-agent）
6. 点击 "创建"

#### 1.2 启用 Custom Search API
1. 在左侧菜单中，选择 "API 和服务" > "库"
2. 搜索 "Custom Search API"
3. 点击 "Custom Search API"
4. 点击 "启用"

#### 1.3 创建 API 密钥
1. 在左侧菜单中，选择 "API 和服务" > "凭据"
2. 点击 "创建凭据" > "API 密钥"
3. 复制生成的 API 密钥
4. （可选）点击 "限制密钥" 添加安全限制

#### 1.4 创建自定义搜索引擎
1. 访问 [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. 点击 "添加"
3. 配置搜索引擎：
   - 要搜索的网站：输入 `*`（搜索整个网络）
   - 语言：中文
   - 搜索引擎名称：OpenAI Agent Search
4. 点击 "创建"
5. 复制 "搜索引擎 ID"（cx 参数）

---

### 步骤 2: 安装依赖

```bash
cd /Users/juntinghua/Desktop/agent
npm install googleapis
```

---

### 步骤 3: 配置环境变量

在 `.env.local` 文件中添加：

```env
GOOGLE_API_KEY=你的_Google_API_密钥
GOOGLE_CSE_ID=你的_搜索引擎_ID
```

---

### 步骤 4: 更新代码

完成后我会帮你更新 `lib/tools.ts` 文件。

---

## 第二部分：代码执行集成（选择一个方案）

### 方案 A: Judge0 API（推荐新手）

#### 优点：
- 简单易用
- 无需本地安装 Docker
- 支持 60+ 编程语言
- 有免费层级

#### 缺点：
- 需要网络请求
- 免费层级有限制（50次/天）

#### 步骤 1: 获取 Judge0 API 密钥

1. 访问 [RapidAPI](https://rapidapi.com/)
2. 注册/登录账号
3. 搜索 "Judge0"
4. 选择 "Judge0 CE"
5. 订阅免费计划
6. 复制你的 API 密钥

#### 步骤 2: 安装依赖

```bash
npm install axios
```

#### 步骤 3: 配置环境变量

在 `.env.local` 中添加：

```env
JUDGE0_API_KEY=你的_RapidAPI_密钥
```

---

### 方案 B: Docker 沙箱（推荐生产环境）

#### 优点：
- 完全免费
- 完全控制
- 高安全性
- 无使用限制

#### 缺点：
- 需要安装 Docker
- 配置稍复杂
- 需要本地资源

#### 步骤 1: 确保 Docker 已安装

```bash
# 检查 Docker 是否安装
docker --version

# 如果未安装，访问 https://www.docker.com/products/docker-desktop
# 下载并安装 Docker Desktop for Mac
```

#### 步骤 2: 安装依赖

```bash
npm install dockerode
```

#### 步骤 3: 拉取必要的镜像

```bash
docker pull python:3.11-slim
docker pull node:18-slim
```

---

## 快速测试命令

安装完成后，你可以用这些命令测试：

### 测试网页搜索
```
"搜索 OpenAI GPT-4 的最新信息"
```

### 测试代码执行
```
"写一个 Python 程序计算 1 到 100 的和"
```

---

## 下一步

告诉我你选择：
1. 代码执行方案：Judge0 (A) 还是 Docker (B)？
2. 你是否已经有 Google API 密钥？

我会根据你的选择提供具体的代码更新。

