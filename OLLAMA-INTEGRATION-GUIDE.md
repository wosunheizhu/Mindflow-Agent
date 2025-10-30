# Ollama 集成完成指南

## 🎉 集成完成

您的 AI Agent 工作台已成功集成 Ollama 支持，可以使用本地部署的 GPT-OSS-20B 模型。

## 📋 配置步骤

### 1. 环境变量配置

在项目根目录创建 `.env.local` 文件：

```bash
# AI 模型配置
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gpt-oss-20b

# 其他 API（可选）
BRAVE_API_KEY=your_brave_api_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_search_engine_id
```

### 2. 启动 Ollama 服务

```bash
# 启动 Ollama 服务
ollama serve

# 下载并运行模型（如果还没有）
ollama pull gpt-oss-20b
```

### 3. 测试集成

```bash
# 运行测试脚本
node test-ollama.js
```

### 4. 启动应用

```bash
# 开发模式
npm run dev

# 或生产模式
npm run build
npm start
```

## 🔧 功能特性

### ✅ 已支持功能
- **基础对话**: 与 GPT-OSS-20B 进行文本对话
- **流式响应**: 实时显示 AI 回复
- **深度思考模式**: 调整温度参数优化回复质量
- **文件上传**: 支持图片和文档上传（需要额外配置）
- **多模型切换**: 可在 OpenAI 和 Ollama 之间切换

### ⚠️ 限制说明
- **工具调用**: Ollama 模式下工具调用功能被禁用（本地模型不支持 OpenAI 格式的工具调用）
- **图片分析**: 需要额外配置 Vision 模型
- **API 依赖**: 搜索、代码执行等功能仍需要外部 API

## 🎛️ 界面操作

### 设置页面 (`/settings`)
- 选择 AI 服务提供商
- 配置 Ollama 连接参数
- 查看配置说明和故障排除

### 聊天页面 (`/chat`)
- 与本地模型进行对话
- 上传文件进行分析
- 切换深度思考模式

## 🚀 性能优化

### Ollama 配置建议
```bash
# 设置环境变量优化性能
export OLLAMA_NUM_PARALLEL=1
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_MAX_QUEUE=512
```

### 模型参数调优
- **标准模式**: temperature=0.7, num_predict=2000
- **深度思考**: temperature=0.3, num_predict=4000

## 🔍 故障排除

### 常见问题

1. **连接失败**
   ```bash
   # 检查 Ollama 服务状态
   curl http://localhost:11434/api/tags
   ```

2. **模型不存在**
   ```bash
   # 下载模型
   ollama pull gpt-oss-20b
   ```

3. **端口冲突**
   ```bash
   # 更改端口
   OLLAMA_HOST=0.0.0.0:11435 ollama serve
   ```

4. **内存不足**
   ```bash
   # 检查系统资源
   ollama ps
   ```

## 📊 监控和日志

### 查看 Ollama 日志
```bash
# 查看服务日志
ollama logs

# 查看运行中的模型
ollama ps
```

### 应用日志
- 浏览器开发者工具 → Network 标签
- 服务器控制台输出

## 🎯 下一步

1. **测试对话功能**: 在聊天界面与 GPT-OSS-20B 对话
2. **配置其他工具**: 设置搜索、代码执行等 API
3. **性能调优**: 根据硬件配置调整模型参数
4. **扩展功能**: 考虑添加更多本地模型支持

---

**🎉 恭喜！您现在可以使用本地部署的 GPT-OSS-20B 模型了！**
