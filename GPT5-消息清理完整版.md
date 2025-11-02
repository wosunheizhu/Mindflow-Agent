# GPT-5 消息清理 - 完整版

## ✅ 已实现的清理逻辑

### 🔧 核心修复

**问题**: `Unknown parameter: 'input[4].tool_calls'`

**原因**: 消息历史中包含 `tool_calls` 字段，但 Responses API 不接受这种"模型产出字段"作为输入。

**解决**: 实现彻底的消息清理逻辑

### 📝 清理规则

#### 1. **移除模型产出字段**
- ❌ `tool_calls` - 不能作为输入
- ❌ `toolCalls` - 驼峰命名版本
- ❌ `function_call` - 旧版本字段

#### 2. **跳过空消息**
- 只有 `tool_calls` 没有 `content` 的消息 → 跳过
- 避免发送空消息到 API

#### 3. **保留的字段**
- ✅ `role` - 必须
- ✅ `content` - 必须（除了 tool 消息）
- ✅ `tool_call_id` - tool 消息需要

### 🔍 调试日志

现在会显示：

```
📝 清理后的消息: 5 条（跳过 1 条空消息）
  ⚠️ 消息 [2] role=assistant 包含 tool_calls，将被移除
  ⚠️ 消息 [3] role=assistant 没有 content，跳过
  ✅ 确认：input 中无 tool_calls 字段
```

### 🎯 验证机制

```python
# 双重验证
input_json = json.dumps(cleaned_input)
if "tool_calls" in input_json or "toolCalls" in input_json:
    print(f"  ⚠️⚠️⚠️ 警告：清理后的 input 仍包含 tool_calls！")
else:
    print(f"  ✅ 确认：input 中无 tool_calls 字段")
```

## 🧪 现在测试

### 服务状态

```bash
curl http://localhost:8002/health
# 应返回: {"status":"healthy","api_configured":true}
```

### 在 Mindflow 中测试

1. 选择 **Mindflow-Y** 或 **Mindflow-Y-Pro**
2. 启用工具调用
3. 发送消息：
   ```
   你好
   ```

### 预期日志

```
📝 清理后的消息: X 条（跳过 Y 条空消息）
✅ 确认：input 中无 tool_calls 字段
📤 发送到 OpenAI Responses API
📥 收到 OpenAI Responses API 响应
✅ 解析结果: 文本长度=XXX
```

**不应该再看到**: `Unknown parameter: 'input[X].tool_calls'`

## 📊 清理前后对比

### 清理前（错误）
```json
{
  "input": [
    {
      "role": "assistant",
      "content": "...",
      "tool_calls": [...]  // ❌ 导致 400 错误
    }
  ]
}
```

### 清理后（正确）
```json
{
  "input": [
    {
      "role": "assistant",
      "content": "..."
      // ✅ 没有 tool_calls
    }
  ]
}
```

## 🎉 关键改进

1. **彻底移除禁止字段** - 不仅不复制，还主动检测并警告
2. **跳过空消息** - 避免发送无意义的消息
3. **双重验证** - JSON 字符串级别的检查
4. **详细日志** - 每个清理步骤都有日志

---

**立即测试！应该不会再有 400 错误了！** 🚀

