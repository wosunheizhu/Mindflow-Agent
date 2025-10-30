# 🛠️ 智能体工具使用指南

本应用集成了多种强大的 AI 工具，可以执行各种复杂任务。

---

## 📋 可用工具列表

### 1. 🔍 网页搜索 (Web Search)

**功能**: 搜索互联网获取实时信息

**使用示例**:
```
"搜索最新的人工智能新闻"
"查找今天的天气情况"
"OpenAI 最新发布了什么产品？"
```

**自动触发条件**:
- 询问实时信息
- 需要查找最新新闻
- 需要验证事实

**注意**: 当前为模拟版本。要启用真实搜索，需要集成 Google Custom Search 或 Bing Search API。

---

### 2. 💻 代码执行器 (Code Interpreter)

**功能**: 执行 Python/JavaScript 代码并返回结果

**使用示例**:
```
"用 Python 计算斐波那契数列的前 10 项"
"写一个函数来排序数组"
"帮我分析这个数据集：[1, 2, 3, 4, 5]"
```

**自动触发条件**:
- 需要执行代码
- 数据分析任务
- 算法实现

**注意**: 当前为模拟版本。生产环境需要 Docker 沙箱或类似的安全执行环境。

---

### 3. 🖼️ 图像生成 (Image Generation)

**功能**: 根据文字描述生成高质量图像

**使用示例**:
```
"生成一张未来城市的概念图"
"画一个可爱的机器人"
"创建一个抽象艺术作品"
```

**自动触发条件**:
- 明确要求生成图像
- 需要视觉创作
- 设计需求

**技术**: 使用 OpenAI DALL-E 3 模型

**支持尺寸**:
- 1024x1024 (正方形)
- 1792x1024 (横向)
- 1024x1792 (纵向)

**注意**: 需要 OpenAI API 密钥有 DALL-E 访问权限。

---

### 4. 🌤️ 天气查询 (Weather)

**功能**: 获取指定城市的天气信息

**使用示例**:
```
"北京今天天气怎么样？"
"上海的气温是多少？"
"查询深圳的天气"
```

**自动触发条件**:
- 询问天气
- 查询气温、湿度

**返回信息**:
- 温度（摄氏度/华氏度）
- 天气状况
- 湿度

**注意**: 当前为模拟数据。要获取真实天气，需要集成 OpenWeatherMap 或类似 API。

---

### 5. 🔢 数学计算器 (Calculator)

**功能**: 执行复杂的数学计算

**使用示例**:
```
"计算 123 × 456"
"sqrt(144) 的值是多少？"
"sin(45) + cos(45)"
"解方程 2x + 5 = 15"
```

**自动触发条件**:
- 数学计算需求
- 方程求解
- 三角函数、对数等

**支持运算**:
- 基本运算：+, -, ×, ÷
- 幂运算：^, sqrt, cbrt
- 三角函数：sin, cos, tan
- 对数：log, ln
- 常数：pi, e

**技术**: 使用 mathjs 库

---

### 6. 📄 文件搜索 (File Search)

**功能**: 在上传的文档中搜索信息

**使用示例**:
```
"在文档中搜索关于'机器学习'的内容"
"查找 PDF 中的第 5 章"
"文件里有提到数据分析吗？"
```

**自动触发条件**:
- 询问文档内容
- 需要引用文件信息

**注意**: 当前为模拟版本。要实现真实文件搜索，需要：
1. 集成向量数据库（Pinecone, Weaviate）
2. 实现文件上传功能
3. 文档分块和嵌入

---

## 🎯 使用技巧

### 如何让 AI 使用工具

AI 会**自动判断**何时需要使用工具。你只需要自然地提出需求：

**✅ 好的提问方式**:
- "帮我搜索最新的 AI 新闻"（会触发网页搜索）
- "计算 1234 × 5678"（会触发计算器）
- "生成一张日落的图片"（会触发图像生成）

**❌ 不必要的说明**:
- "使用网页搜索工具查找..."（AI 会自动选择）
- "调用计算器函数计算..."（过于技术化）

### 组合使用工具

AI 可以在一次对话中使用多个工具：

```
"搜索今天的天气，然后根据天气情况生成一张配图"
```

这会触发：
1. 天气查询工具
2. 图像生成工具

---

## 📊 工具使用流程

```
用户提问
    ↓
AI 分析需求
    ↓
判断需要的工具
    ↓
调用工具执行
    ↓
显示工具结果
    ↓
AI 整合结果回复
```

---

## 🎨 工具结果展示

### 文本结果
显示在蓝色卡片中，包含：
- 工具图标和名称
- 输入参数
- 执行结果

### 图像结果
- 完整图像显示
- 提示词说明
- 尺寸信息

### 代码结果
- 语法高亮
- 执行输出
- 错误信息（如有）

---

## 🔧 自定义工具开发

### 添加新工具

1. **在 `lib/tools.ts` 中定义工具**:

```typescript
{
  type: "function",
  function: {
    name: "your_tool_name",
    description: "工具描述",
    parameters: {
      type: "object",
      properties: {
        param1: {
          type: "string",
          description: "参数说明",
        },
      },
      required: ["param1"],
    },
  },
}
```

2. **实现工具函数**:

```typescript
async function yourToolFunction(param1: string) {
  // 实现逻辑
  return { result: "结果" };
}
```

3. **在 executeToolCall 中注册**:

```typescript
case "your_tool_name":
  return await yourToolFunction(args.param1);
```

---

## 💡 实际应用场景

### 数据分析
```
用户: "分析这组数据：[10, 20, 30, 40, 50]，计算平均值和标准差"
AI: [使用代码执行器] → 返回统计结果
```

### 研究助手
```
用户: "搜索量子计算的最新进展，并总结要点"
AI: [使用网页搜索] → 总结信息
```

### 创意设计
```
用户: "生成三张不同风格的科技感背景图"
AI: [使用图像生成] → 创建三张图片
```

### 教学辅助
```
用户: "解释什么是递归，并给出代码示例"
AI: [使用代码执行器] → 演示递归代码
```

---

## ⚙️ 高级配置

### 禁用工具

在发送请求时设置 `useTools: false`:

```typescript
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({
    messages: [...],
    useTools: false, // 禁用工具
  }),
});
```

### 限制工具使用

修改 `app/api/chat/route.ts` 中的工具列表，只包含需要的工具。

---

## 🚀 生产环境部署

### 集成真实 API

**网页搜索**:
- Google Custom Search API
- Bing Web Search API
- Serper API

**代码执行**:
- Docker 沙箱环境
- AWS Lambda
- Google Cloud Functions

**文件检索**:
- Pinecone (向量数据库)
- Weaviate
- Milvus

**天气数据**:
- OpenWeatherMap API
- WeatherAPI
- AccuWeather API

---

## 📚 相关文档

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [DALL-E API](https://platform.openai.com/docs/guides/images)
- [Tools API Reference](https://platform.openai.com/docs/api-reference/chat/create#tools)

---

## ❓ 常见问题

### Q: 工具调用失败怎么办？
A: 检查 API 密钥、网络连接，查看控制台错误信息。

### Q: 如何知道 AI 使用了哪个工具？
A: 工具调用会在对话中以蓝色卡片形式显示。

### Q: 可以同时使用多个工具吗？
A: 可以，AI 会自动决定调用顺序。

### Q: 工具响应时间太长？
A: 复杂工具（如图像生成）需要较长时间，这是正常的。

---

**更新日期**: 2025-10-25  
**版本**: 2.0  
**作者**: AI Assistant

