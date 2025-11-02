# GPT-5 集成文件清单

## 📋 涉及的文件

### 🎯 核心文件（必须）

#### 1. **独立 GPT-5 服务**

| 文件 | 路径 | 作用 | 状态 |
|------|------|------|------|
| **gpt5_service.py** | `/gpt5_service.py` | GPT-5 Responses API 服务主文件 | ✅ 已创建 |
| **start_gpt5_service.sh** | `/start_gpt5_service.sh` | 服务启动脚本 | ✅ 已创建 |
| **venv_gpt5/** | `/venv_gpt5/` | Python 虚拟环境 | ✅ 已创建 |
| **gpt5_service.log** | `/gpt5_service.log` | 服务日志文件 | ✅ 自动生成 |

#### 2. **Next.js 后端集成**

| 文件 | 路径 | 作用 | 状态 |
|------|------|------|------|
| **route.ts** | `/app/api/chat/route.ts` | 聊天 API，调用 GPT-5 服务 | ✅ 已修改 |

#### 3. **环境配置**

| 文件 | 路径 | 作用 | 状态 |
|------|------|------|------|
| **.env** | `/.env` | GPT-5 服务环境变量 | ✅ 已配置 |
| **.env.local** | `/.env.local` | Next.js 环境变量 | ✅ 已配置 |

### 📚 文档文件（参考）

| 文件 | 路径 | 作用 |
|------|------|------|
| **gpt5.md** | `/gpt5.md` | GPT-5 API 使用文档 |
| **gpt5-thinking调用方式.md** | `/gpt5-thinking调用方式.md` | GPT-5 调用示例 |
| **响应解析-最终修复.md** | `/响应解析-最终修复.md` | 响应解析说明 |
| **诊断脚本.md** | `/诊断脚本.md` | 诊断脚本 |

---

## 📂 详细说明

### 1. gpt5_service.py

**位置**: `/Users/juntinghua/Desktop/agent/gpt5_service.py`

**核心功能**:
- 接收来自 Next.js 的请求
- 调用 OpenAI Responses API
- 转换工具格式（Chat Completions → Responses API）
- 解析响应（提取文本、推理、工具调用）
- 支持 `previous_response_id` 上下文续写

**关键代码**:
```python
@app.post("/api/responses")
async def create_response(request: GPT5Request):
    # 调用 OpenAI Responses API
    # 转换工具格式
    # 解析响应
```

**端口**: 8002

---

### 2. app/api/chat/route.ts

**位置**: `/Users/juntinghua/Desktop/agent/app/api/chat/route.ts`

**修改部分**:

#### A. 变量声明（第 195 行）
```typescript
let previousResponseId: string | null = null;
```

#### B. gpt5-pro 分支（第 374-549 行）
```typescript
} else if (aiService.provider === 'gpt5-pro') {
  // 构建 Responses API 参数
  // 添加内置 web_search 工具
  // 使用 previous_response_id
  // 调用 GPT-5 服务 (8002 端口)
  // 处理工具调用和续写
}
```

#### C. gpt5-thinking 分支（第 550-725 行）
```typescript
} else if (aiService.provider === 'gpt5-thinking') {
  // 与 gpt5-pro 类似
  // reasoning.effort = "low"（轻量级）
}
```

**关键逻辑**:
1. 添加 `{ type: "web_search" }` 内置工具
2. 调用 `http://localhost:8002/api/responses`
3. 保存 `response_id` 用于续写
4. 处理工具调用并使用 `previous_response_id`

---

### 3. 环境变量配置

#### .env（GPT-5 服务读取）
```bash
OPENAI_API_KEY=sk-proj-...
GPT5_SERVICE_URL=http://localhost:8002
```

#### .env.local（Next.js 读取）
```bash
OPENAI_API_KEY=sk-proj-...
GPT5_SERVICE_URL=http://localhost:8002
```

---

## 🔧 关键修改点

### 1. 工具格式转换（gpt5_service.py 第 112-152 行）

```python
# Chat Completions 格式转换为 Responses API 格式
{"type": "function", "function": {"name": "x"}} 
    ↓
{"type": "function", "name": "x"}

# 内置工具
{"type": "web_search"}  # 直接传递
```

### 2. 响应解析（gpt5_service.py 第 204-316 行）

```python
# 遍历 output 数组
for item in result["output"]:
    if item["type"] == "message":
        # 提取文本
    elif item["type"] == "function_call":
        # 提取工具调用
    elif item["type"] == "reasoning":
        # 提取推理
```

### 3. previous_response_id 续写（route.ts）

```typescript
// 保存 response_id
previousResponseId = gpt5Response.response_id;

// 下一轮使用
gpt5Params.previous_response_id = previousResponseId;
```

---

## 🚀 启动流程

### 1. 启动 GPT-5 服务
```bash
./start_gpt5_service.sh
# 或
source venv_gpt5/bin/activate && python gpt5_service.py
```

### 2. 启动 Next.js
```bash
pnpm run dev
```

### 3. 验证
```bash
# 检查 GPT-5 服务
curl http://localhost:8002/health

# 检查 Next.js
curl http://localhost:3000
```

---

## 📊 依赖关系图

```
用户
  ↓
Next.js (3000)
  ├── app/api/chat/route.ts
  │   ↓ HTTP POST
  │   GPT-5 Service (8002)
  │   └── gpt5_service.py
  │       ↓ HTTPS
  │       OpenAI Responses API
  │       
  └── .env.local (环境变量)

GPT-5 Service (8002)
  ├── gpt5_service.py
  ├── venv_gpt5/ (虚拟环境)
  ├── .env (环境变量)
  └── gpt5_service.log (日志)
```

---

## 🔍 如何检查集成状态

### 1. 检查文件是否存在
```bash
ls -la gpt5_service.py start_gpt5_service.sh venv_gpt5/
```

### 2. 检查服务是否运行
```bash
# GPT-5 服务
curl http://localhost:8002/health

# 检查进程
ps aux | grep gpt5_service
```

### 3. 检查环境变量
```bash
cat .env | grep GPT5
cat .env.local | grep GPT5
```

### 4. 检查代码修改
```bash
# 检查 route.ts 是否包含 gpt5-pro 和 gpt5-thinking
grep -n "gpt5-pro\|gpt5-thinking" app/api/chat/route.ts
```

---

## 📝 快速命令

```bash
# 查看所有 GPT-5 相关文件
ls -la gpt5* GPT5* start_gpt5* venv_gpt5/

# 查看服务日志
tail -f gpt5_service.log

# 重启 GPT-5 服务
pkill -f gpt5_service.py && ./start_gpt5_service.sh

# 完整检查
echo "GPT-5 Service: $(curl -s http://localhost:8002/health)"
echo "Next.js: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
```

---

## ✅ 集成清单

- [x] `gpt5_service.py` - Python FastAPI 服务
- [x] `start_gpt5_service.sh` - 启动脚本
- [x] `venv_gpt5/` - Python 虚拟环境
- [x] `app/api/chat/route.ts` - Next.js 集成
- [x] `.env` - GPT-5 服务环境变量
- [x] `.env.local` - Next.js 环境变量
- [x] 工具格式转换逻辑
- [x] 响应解析逻辑
- [x] previous_response_id 支持
- [x] 内置 web_search 工具支持

---

**总计 4 个核心文件 + 2 个配置文件**

