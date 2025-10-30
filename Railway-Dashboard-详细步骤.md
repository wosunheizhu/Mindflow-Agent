# Railway Dashboard 部署前端 - 详细图文步骤

## 🎯 找不到 "Dockerfile Path"？这里是准确的位置！

Railway 的设置位置在 2024 年有所更新，按照以下步骤操作：

---

## 📋 完整步骤

### Step 1: 登录并选择项目

1. 访问 **https://railway.app/dashboard**
2. 登录您的账号
3. 选择您已有的项目（后端服务所在的项目）

---

### Step 2: 创建新服务

1. 在项目页面，点击右上角的 **"+ New"** 按钮
2. 在下拉菜单中选择 **"GitHub Repo"**
3. 选择您的仓库（如果没看到，点击 "Configure GitHub App" 添加）
4. 选择分支（通常是 `main` 或 `master`）

---

### Step 3: 配置服务（重要！）

#### 🔍 找到 Dockerfile Path 的正确位置

服务创建后，Railway 会自动开始检测和构建。但我们需要指定使用 `Dockerfile.frontend`：

**方法 1：在 Settings 中配置（推荐）**

1. 点击新创建的服务
2. 点击顶部的 **"Settings"** 标签
3. 向下滚动找到 **"Build"** 或 **"Source"** 部分
4. 查找以下选项之一：
   - **"Builder"** → 选择 `Dockerfile`
   - **"Dockerfile Path"** → 输入 `Dockerfile.frontend`
   - **"Custom Build Command"** → 留空（使用 Dockerfile）

**方法 2：通过 Service Settings 菜单**

1. 点击服务名称
2. 点击右上角的 **"⚙️"** 图标（齿轮）
3. 选择 **"Settings"**
4. 查找 **"Source"** 或 **"Deploy"** 区域
5. 设置：
   - Root Directory: `/` （默认）
   - Dockerfile Path: `Dockerfile.frontend`

**方法 3：使用 railway.toml 文件（最简单！）**

如果找不到 UI 设置，可以使用配置文件：

```bash
# 在项目根目录创建 railway.toml
cat > railway.toml << 'EOF'
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile.frontend"

[deploy]
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
EOF
```

然后提交并推送：
```bash
git add railway.toml
git commit -m "添加 Railway 配置文件"
git push origin main
```

---

### Step 4: 添加环境变量

1. 在服务页面，点击 **"Variables"** 标签
2. 点击 **"+ New Variable"** 或 **"Raw Editor"**

#### 使用 Raw Editor（推荐，批量添加）

点击 **"Raw Editor"** 按钮，粘贴以下内容：

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
OPENAI_API_KEY=替换为您的key
ANTHROPIC_API_KEY=替换为您的key
VOICE_SERVER_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_VOICE_SERVER_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}
SERPER_API_KEY=替换为您的key
JINA_API_KEY=替换为您的key
```

💡 **注意**：`${{backend.RAILWAY_PUBLIC_DOMAIN}}` 中的 `backend` 应该是您后端服务的实际名称。

#### 查看后端服务名称

1. 返回项目主页
2. 查看您的后端服务卡片
3. 服务名称显示在卡片顶部
4. 如果不是 `backend`，请在环境变量中相应修改

---

### Step 5: 触发部署

#### 方法 A：自动部署
- Railway 检测到配置更改后会自动触发部署
- 查看 **"Deployments"** 标签查看进度

#### 方法 B：手动部署
1. 点击 **"Deployments"** 标签
2. 点击右上角的 **"Deploy"** 按钮
3. 选择 **"Deploy Latest"**

---

### Step 6: 监控部署

1. 在 **"Deployments"** 标签中，点击最新的部署
2. 查看实时日志
3. 等待显示 **"Build Successful"** 和 **"Deployed"**

**成功的标志：**
- ✅ 状态显示为绿色的 "Active"
- ✅ 日志中显示 "Listening on port 3000"
- ✅ 可以看到分配的 URL

---

### Step 7: 获取访问 URL

1. 在服务页面，点击 **"Settings"** 标签
2. 向下滚动到 **"Domains"** 部分
3. 您会看到类似这样的 URL：
   ```
   your-app-production-xxxx.up.railway.app
   ```
4. 点击 URL 或复制后在浏览器中打开

---

## 🔧 如果还是找不到 Dockerfile Path

### 解决方案 1：使用 railway.toml（强烈推荐！）

这是最可靠的方法，不依赖 UI：

```bash
# 创建配置文件
cat > railway.toml << 'EOF'
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile.frontend"

[deploy]
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
EOF

# 提交并推送
git add railway.toml
git commit -m "添加 Railway 前端配置"
git push origin main
```

Railway 会自动读取这个文件！

### 解决方案 2：重命名 Dockerfile

如果实在找不到设置，可以临时重命名：

```bash
# 备份原 Dockerfile
mv Dockerfile Dockerfile.backend

# 将前端 Dockerfile 重命名为默认名称
cp Dockerfile.frontend Dockerfile

# 提交
git add -A
git commit -m "临时使用前端 Dockerfile"
git push origin main
```

Railway 会自动检测并使用根目录的 `Dockerfile`。

**注意**：记得之后改回来，或者为前后端创建不同的服务。

### 解决方案 3：使用 Railway CLI（最简单！）

```bash
# 安装 CLI
brew install railway

# 登录
railway login

# 连接项目
railway link

# 创建前端服务并指定 Dockerfile
railway service create frontend

# 然后在创建时，Railway 会询问配置
# 或者手动上传指定 Dockerfile：
railway up --service frontend
```

---

## 📸 Railway UI 参考

### 2024 年最新的 Railway 界面位置

**Service Settings → 可能的位置：**

1. **"General"** 标签
   - Service Name
   - Root Directory
   
2. **"Source"** 标签（如果有）
   - Builder Type
   - Dockerfile Path
   
3. **"Deploy"** 标签
   - Build settings
   - Start Command
   
4. **"Build"** 部分（在任一标签中）
   - Builder: Dockerfile
   - Dockerfile Path: Dockerfile.frontend

---

## ✅ 推荐方案（按优先级）

### 🥇 方案 1：使用 railway.toml（最可靠）

创建配置文件，让 Railway 自动识别：

```bash
# 一键创建配置
cat > railway.toml << 'EOF'
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile.frontend"

[deploy]
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
EOF

git add railway.toml
git commit -m "Railway 前端配置"
git push origin main
```

### 🥈 方案 2：使用 Railway CLI

```bash
./deploy-railway-frontend.sh
```

### 🥉 方案 3：在 Dashboard 中仔细查找

按照上面的详细步骤，在 Settings 的各个标签中查找。

---

## 🐛 常见问题

### Q: 为什么我看不到 "Dockerfile Path" 选项？

**A:** Railway 的 UI 经常更新。可能的原因：
1. Railway 自动检测到了 Dockerfile（使用的是根目录的 Dockerfile）
2. 您需要先选择 Builder Type 为 "Dockerfile"
3. 该选项在不同的标签页中

**解决方案：** 使用 `railway.toml` 文件是最可靠的方法。

### Q: 服务创建后自动构建失败了

**A:** 可能是使用了错误的 Dockerfile。
1. 查看构建日志确认
2. 使用 railway.toml 指定正确的 Dockerfile
3. 或者在 Settings 中修改

### Q: 如何确认使用的是哪个 Dockerfile？

**A:** 查看构建日志：
1. Deployments → 最新部署 → 查看日志
2. 日志开头会显示使用的 Dockerfile 路径

---

## 📞 需要帮助？

如果按照以上步骤仍然遇到问题，请告诉我：
1. 您看到的 Settings 页面有哪些标签？
2. 每个标签下有哪些选项？
3. 或者发送截图（如果可以）

我会根据您的实际情况提供更具体的指导！

---

## 🎯 快速总结

**最简单的方法（3 步）：**

```bash
# 1. 创建配置文件
cat > railway.toml << 'EOF'
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile.frontend"
EOF

# 2. 提交推送
git add railway.toml
git commit -m "Railway 配置"
git push

# 3. 在 Railway Dashboard 创建服务
# Dashboard → New → GitHub Repo → 选择仓库
# Railway 会自动读取 railway.toml
```

就这么简单！🚀

