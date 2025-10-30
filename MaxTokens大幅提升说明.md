# Max Tokens 大幅提升说明

## 修改总结

已将所有 Agentic AI 模型的 max_tokens 大幅提升，以支持生成更长、更详细的内容。

## 具体修改

### 1. Claude (Sonnet 4)

**文件**: `app/api/chat/route.ts`

**修改前**:
```typescript
max_tokens: deepThinking ? 4000 : 2000
```

**修改后**:
```typescript
max_tokens: deepThinking ? 16000 : 8000
```

**提升倍数**: 
- 深度思考模式: 4000 → 16000 (4倍)
- 普通模式: 2000 → 8000 (4倍)

---

### 2. OpenAI (GPT-4o / GPT-4 Turbo)

**文件**: `app/api/chat/route.ts`

**修改前**:
```typescript
max_tokens: 4000 (仅深度思考模式)
// 普通模式未设置
```

**修改后**:
```typescript
max_tokens: deepThinking ? 16000 : 8000
```

**提升倍数**: 
- 深度思考模式: 4000 → 16000 (4倍)
- 普通模式: 无限制 → 8000 (新增限制但确保充足)

---

### 3. 豆包 (Doubao)

**文件**: `app/api/chat/route.ts`

**修改前**:
```typescript
// 未配置 max_tokens
```

**修改后**:
```typescript
max_tokens: deepThinking ? 16000 : 8000
temperature: deepThinking ? 0.3 : 0.7
```

**新增配置**: 
- 深度思考模式: 16000 tokens
- 普通模式: 8000 tokens

---

### 4. GPT-5 / GPT-5-Pro (Responses API)

**文件**: `app/api/chat/route.ts`

**说明**: GPT-5 Responses API 不支持 max_tokens 参数，由模型自动决定输出长度

**配置**: 
- 使用 `verbosity: "high"` 确保详细输出
- 使用 `reasoning.effort: "high"` 或 "medium" 控制推理深度

---

### 5. 数字员工闲聊模式

**文件**: `llm_tts_stream.py`

**修改前**:
```python
max_tokens: 150
```

**修改后**:
```python
max_tokens: 500  # 支持长提示词输出
```

**提升倍数**: 150 → 500 (3.3倍)

**用途**: 确保数字员工能输出完整的 Agentic AI 提示词

---

### 6. 工作流规划器

**文件**: `lib/workflow-planner.ts`

**修改前**:
```typescript
// 未配置 max_tokens
```

**修改后**:
```typescript
max_tokens: 8000
```

**新增配置**: 8000 tokens

**用途**: AI 自主规划复杂工作流时需要足够的输出空间

---

### 7. 图片分析工具

**文件**: `lib/image-analyzer.ts`

**修改前**:
```typescript
max_tokens: 1000
```

**修改后**:
```typescript
max_tokens: 4000
```

**提升倍数**: 1000 → 4000 (4倍)

**用途**: 支持更详细的图片分析和对比结果

---

## 模型能力对比

| 模型 | 深度思考模式 | 普通模式 | 提升倍数 |
|------|------------|---------|---------|
| **Claude Sonnet 4** | 16000 | 8000 | 4倍 |
| **GPT-4o** | 16000 | 8000 | 4倍 |
| **GPT-4 Turbo** | 16000 | 8000 | 4倍 |
| **豆包** | 16000 | 8000 | 新增 |
| **GPT-5** | 自动 | 自动 | - |
| **数字员工** | - | 500 | 3.3倍 |
| **工作流规划** | - | 8000 | 新增 |
| **图片分析** | - | 4000 | 4倍 |

---

## 优势

### 1. 更详细的输出
- 支持生成长文档（报告、分析、方案）
- 复杂任务的完整解释
- 详细的步骤说明

### 2. 更好的工作流规划
- 可以规划更复杂的多步骤工作流
- 包含更详细的参数和逻辑

### 3. 更完整的提示词
- 数字员工可以生成更详细的 Agentic AI 提示词
- 不会因为长度限制而截断

### 4. 更深入的图片分析
- 支持更详细的图片描述
- 更全面的对比分析

---

## 成本影响

### Token 使用量增加
- 输出 tokens 增加 → API 成本增加
- 建议：监控实际使用情况，根据需要调整

### 优化建议
1. **按需使用深度思考模式**：复杂任务才开启
2. **合理提示词**：要求简洁回答时可节省 tokens
3. **监控使用量**：定期检查 API 使用统计

---

## 配置文件清单

已修改的文件：
- ✅ `app/api/chat/route.ts` - 主聊天 API
- ✅ `lib/workflow-planner.ts` - 工作流规划器
- ✅ `lib/image-analyzer.ts` - 图片分析工具
- ✅ `llm_tts_stream.py` - 数字员工闲聊

---

## 测试建议

### 测试长内容生成
```
"帮我创建一份详细的 AI 技术综合报告，包含：
1. 技术框架分析
2. 行业应用案例
3. 伦理治理讨论
4. 未来趋势预测
要求每个部分都要详细展开，包含具体数据和案例"
```

### 预期结果
- ✅ 生成完整的长文档（不会被截断）
- ✅ 包含所有要求的章节
- ✅ 详细的数据和案例
- ✅ 结构化的 Markdown 输出

---

## 服务状态

- ✅ 前端已重启 (端口 3000)
- ✅ 后端运行正常 (端口 8001)
- ✅ 所有修改已生效

现在系统可以生成更长、更详细的内容了！

