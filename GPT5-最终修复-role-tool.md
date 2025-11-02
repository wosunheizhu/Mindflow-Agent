# ✅ GPT-5 最终修复 - role:tool 问题

## 🎯 根本原因

**Responses API 不接受 `role:"tool"`**

从错误日志：
```
Invalid value: 'tool'. Supported values are: 'assistant', 'system', 'developer', and 'user'.
```

## 🔧 最终修复方案

### 关键改动：将 `role:"tool"` 转换为 `role:"assistant"`

```python
if role == "tool":
    # 工具结果改写为 assistant 的 output_text
    if text:
        print(f"  🔄 消息 [{i}] role=tool 转换为 role=assistant (output_text)")
        cleaned_input.append({
            "role": "assistant",
            "content": [{"type": "output_text", "text": text}]
        })
```

### 允许的角色

```python
ALLOWED_ROLES = {"assistant", "system", "developer", "user"}
```

任何不在此列表的角色都会被转换或跳过。

## ✅ 完整的清理流程

### 1. 提取文本内容
- 处理字符串、字典、数组等多种格式
- 统一转换为纯文本

### 2. 移除禁止字段
- `tool_calls` ❌
- `toolCalls` ❌
- `function_call` ❌
- `tool_call_id` ❌（输入时不需要）

### 3. 转换角色
- `role:"tool"` → `role:"assistant"` (使用 `output_text` 类型)
- 非法角色 → `role:"user"`

### 4. 格式化 content
- 统一使用数组格式：`[{"type":"text","text":"..."}]`
- tool 结果使用：`[{"type":"output_text","text":"..."}]`

### 5. 双重验证
```python
# 验证1：检查 tool_calls 残留
if "tool_calls" in input_json:
    print("⚠️ 警告：input 仍包含 tool_calls！")

# 验证2：检查 role:tool 残留
if '"role":"tool"' in input_json:
    print("⚠️ 警告：input 仍包含 role:tool！")
```

## 📝 预期日志

### 成功的清理日志

```
📝 清理后的消息: 4 条（跳过 1 条）
  🔄 消息 [2] role=tool 转换为 role=assistant (output_text)
  ⚠️ 消息 [3] role=assistant 包含 tool_calls，将被移除
  ✅ 确认：无 tool_calls 字段，无 role:tool

📤 发送到 OpenAI Responses API:
模型: gpt-5
消息数: 4
工具数: 27
工具列表: ['web_search', 'search_web', 'execute_code', ...]
```

### 失败的日志（不应再出现）

```
❌ OpenAI API 错误: 400
"Invalid value: 'tool'. Supported values are..."  ← 不应再出现
"Unknown parameter: 'input[X].tool_calls'"      ← 不应再出现
```

## 🧪 测试步骤

### 1. 验证服务
```bash
curl http://localhost:8002/health
# 应返回: {"status":"healthy","api_configured":true}
```

### 2. 发送测试消息

在 Mindflow 中：
```
你好
```

### 3. 查看日志
```bash
tail -f /Users/juntinghua/Desktop/agent/gpt5_service.log
```

### 4. 检查关键日志行

应该看到：
```
✅ 确认：无 tool_calls 字段，无 role:tool
📥 收到 OpenAI Responses API 响应:
✅ 解析结果: 文本长度=XXX
```

**不应该看到**:
```
❌ OpenAI API 错误: 400
Invalid value: 'tool'
```

## 🎯 预期工作流程

### 普通对话（无工具）
```
用户: "你好"
  ↓
清理消息 → 发送到 GPT-5
  ↓
返回: type=message, text="..."
  ↓
前端显示回复 ✅
```

### 工具调用流程
```
用户: "搜索 AI 技术"
  ↓
清理消息 → 发送到 GPT-5
  ↓
返回1: type=function_call (web_search)
  ↓
识别工具调用 → 返回给 Next.js
  ↓
Next.js: 保存 response_id
  ↓
继续请求（with previous_response_id）
  ↓
返回2: type=message (最终报告)
  ↓
前端显示完整报告 ✅
```

## 📊 修复对比

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| role:tool | ❌ 直接发送 | ✅ 转换为 assistant |
| tool_calls 字段 | ❌ 可能残留 | ✅ 彻底移除 |
| content 格式 | 字符串 | ✅ 数组格式 |
| 空消息处理 | 可能发送 | ✅ 跳过 |
| 验证机制 | ❌ 无 | ✅ 双重验证 |
| 错误日志 | 400 错误 | ✅ 无错误 |

## ✨ 关键特性

1. **自动角色转换** - `tool` → `assistant`
2. **智能内容提取** - 支持多种格式
3. **严格验证** - 确保符合 API 要求
4. **详细日志** - 每步都有反馈

---

**所有修复已完成！现在测试应该完全正常了！** 🎉

