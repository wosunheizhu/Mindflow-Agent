下面我整理了一份关于 GPT‑5 系列（包括其 “agentic AI／工具调用”能力）在开发者侧如何调用的说明，重点在于原生支持 agent 模式、工具函数调用、自主流程控制等方面。你作为希望用 “Cursor prompt” 建立自动化开发系统的用户，这份说明可以作为一个参考模板。注意：由于这是比较新的模型（2025 年8月推出），“正式”文档可能随时更新，建议你在实际接入时查阅官方 API 文档。

---

## 一、GPT-5 系列关键能力概览

* GPT-5 是 OpenAI 在 2025 年推出的旗舰模型，具备先进的推理能力、工具调用能力、自主规划 (“agentic”) 行为。 ([OpenAI][1])
* 它支持以“代理/工具调用”模式（agentic workflows）：即模型不仅直接产生回答，而是在任务中选择、调用、串联多种工具（如 API 调用、脚本执行、数据库查询）以完成更复杂的流程。 ([Medium][2])
* 在开发者文档中，推荐使用所谓 “Responses API” 而不仅仅是典型的 Chat Completions 接口，从而保留模型“思考上下文／工具调用历史”以支持长期、多步任务。 ([OpenAI Cookbook][3])
* 在调用选项中，引入新的参数如 `reasoning_effort`（控制模型思考深度）、`textVerbosity`（控制响应详略）等，对 agentic 行为的控制变得更精细。 ([OpenAI Cookbook][3])
* 在工具调用方面，GPT-5 支持两种方式：

  1. **结构化函数调用**（Structured Function Calling）：以 JSON Schema 定义函数，模型尝试生成符合该 Schema 的调用。 ([DataCamp][4])
  2. **自由形式函数调用**（Free-Form Function Calling）：模型可以输出 raw 脚本／SQL／命令行等文本，直接供系统执行，从而减少中间解析开销。 ([Medium][2])

---

## 二、调用 GPT-5 的基本流程（开发者视角）

以下为典型接入步骤，你可以将其适配到你的 “Cursor prompt + FastAPI” 架构中。

1. **初始化 API 客户端**

   * 获取 OpenAI API Key，并在你的环境中配置。
   * 选择模型 ID，如 `"gpt-5"`（或后续如 `"gpt-5-mini"`、`"gpt-5-nano"`，根据成本与响应速度权衡） ([ai-sdk.dev][5])
   * 在你的后端（比如用 Python + FastAPI）中构建一个封装函数：例如 `call_model(model="gpt-5", prompt=…, params=…)`

2. **构造 Prompt + 配置参数**

   * 在 prompt 中明确你的任务、上下文、可用工具、期望行为。比如：

     ```text
     You are an autonomous agent. You have access to the following tools:  
     1. query_database(sql: string) → returns records  
     2. run_script(code: string) → executes and returns output  
     Goal: [你的目标]  
     ```
   * 在 API 调用参数中包含：

     * `reasoning_effort`：如 `"low"`, `"medium"`, `"high"`，用于控制模型调用工具与规划的深度。 ([OpenAI Cookbook][3])
     * `textVerbosity`：如 `"low"`, `"medium"`, `"high"`，用以控制最终回答的长度与详尽程度。 ([ai-sdk.dev][5])
   * 提供先前的响应 context（如果使用 Responses API）以让模型继承之前思考轨迹。 ([OpenAI Cookbook][3])

3. **工具定义／注册**

   * 在系统侧明确定义哪些工具模型可以视为调用对象。每个工具包括名称、用途、输入 型别、输出说明。
   * 对于结构化函数调用，定义 JSON Schema；对于自由形式工具，可允许模型输出脚本/命令。 ([Medium][2])
   * 系统需要监控模型建议的工具调用、执行这些调用、将结果返回给模型作为后续 prompt 的一部分。

4. **执行流程 & 状态管理**

   * 接到模型的工具调用建议后，由你系统执行该函数／脚本。
   * 将函数返回值（结果）反馈回模型，模型可继续下一步思考或最终生成用户交付结果。
   * 借助 Responses API，你可以传入 `previous_response_id` 等参数，使模型“记住”之前调用历史，从而提升 agentic 流程的连贯性与效率。 ([OpenAI Cookbook][3])

5. **整合至你的系统**

   * 在你的项目（如使用 FastAPI 后端 + React 前端）中，你可以封装一个 “AgentRunner” 模块：

     * 接收用户指令 → 调用 GPT-5（传 prompt＋工具定义） → 根据模型建议执行工具 → 返回新的 prompt 给模型或给用户。
   * 建议将 “工具调用”作为事件流处理，在前端可显示执行状态（“正在执行 SQL 查询”、“脚本运行完毕”）以便用户可视化理解流程。
   * 由于你想用 Cursor prompt，你可以将 prompt 模板存入 Cursor，并通过变量注入上下文（例如用户目标、可用工具、预算／时间限制等）。

---

## 三、Agentic 特性与如何启用／定制

因为你特别提到“原生支持 agentic AI”的方面，下面是 GPT-5 在这一维度较为重要的特性，以及你可以如何在系统中启用和调优。

### 3.1 特性亮点

* GPT-5 在 “instruction following & agentic tool use” 的基准上有显著提升。 ([OpenAI][1])
* 模型能够根据任务自动判断：是直接回答、还是调用某些工具、还是先做规划、再执行。 —— 也就是说，它具备一定 “策略选择” 的能力。 ([Medium][2])
* 支持长期上下文（多步任务）， Responses API 使模型能够记忆之前的推理／调用状态，从而避免每次从头开始。 ([OpenAI Cookbook][3])
* 自由形式函数调用（free-form）增强了模型对 “执行” 型任务（如写脚本、配置、SQL）而不仅仅 “生成文本” 的能力。 ([Medium][2])

### 3.2 如何在你的系统中定制 agentic 行为

* **控制自治程度**：利用 `reasoning_effort` 参数可以决定模型“主动性”高低。例如：

  * 若设为 `low`，模型更倾向快速给出答案、少做工具调用。
  * 若设为 `high`，模型会更多地规划、调用多步骤工具、甚至修改策略。 ([OpenAI Cookbook][3])
* **定义工具调用预算／流程约束**：例如你可以在 prompt 中设置：

  ```text
  You may call at most 3 tools in this turn. If you need more, ask for user confirmation.
  ```

  这样可以限制模型过度工具调用。 ([OpenAI Cookbook][3])
* **提供进度反馈机制**：在你的系统中，当模型调用工具时，前端或日志中可以反馈 “工具 X 已调用，正在等待结果” 给用户/系统，这样用户可参与流程或介入。
* **调整输出详略**：利用 `textVerbosity` 参数控制模型最终答复的长度。例如：对于 UI 快速响应希望简洁，则设为 `low`；若用于报告生成则设为 `high`。 ([ai-sdk.dev][5])
* **Prompt 模板设计**：根据你项目需求（如自动化开发系统），可设计专门的 prompt 模板。例如：

  ```text
  Agent Role: You are the “Orchestrator AI” in a software-development system.  
  Tools available: generate_code(), run_tests(), commit_changes(), send_notification()  
  Current Task: […]  
  Constraints: Code must target Mac OS compatibility. Use our design system library.  
  Reasoning_effort: high  
  ```

  这样模型非常明确你的开发环境、工具、任务。
* **状态追踪**：利用 Responses API 的 `previous_response_id` 将上次模型调用结果传入，让模型无需重新梳理全流程。这样效率高、成本低。 ([OpenAI Cookbook][3])

---

## 四、在你当前技术栈中的建议整合（你提到的栈）

因为你使用 Mac OS、前端：React + Tailwind CSS（或 Next.js）、后端：FastAPI + SQLAlchemy + Postgres + Docker／K8s，下面是一些结合提示：

* 在后端（FastAPI）中，创建一个服务接口 `/agent-run`，接收用户／系统任务请求，内部调用 GPT-5 API。
* 把工具执行部分也封装为 FastAPI 子服务／模块。例如 `tools.py` 中定义 `def generate_code(...)`, `def run_tests(...)`，并注册这些工具给模型。
* 在提示中注明你所使用的技术栈（React，Tailwind，Postgres，Docker 等），这样 GPT-5 可以针对你栈生成兼容代码。
* 使用 Cursor 作为 prompt 管理系统：将 prompt 模板存为 Cursor 实体，输入变量（任务、工具列表、栈说明、预算）由你的 Orchestrator AI 填充，再发送给 GPT-5。
* 使用 `reasoning_effort = “high”` 当任务是 “为你的 AI 娱乐创意软件 MVP 生成完整后端＋CI/CD流程”；而使用 `reasoning_effort = “low”` 当任务是 “给我一个 5 行 SQL 查询”。
* 利用 `textVerbosity` 控制输出：例如前端返回输出给用户时设为 `low`（简明结果），后台日志或开发者视图设为 `high`（含思考过程／工具调用日志）。
* 考虑构建一个 “工具调用日志 UI” 在 React 前端：展示每一步模型建议 + 系统执行 +结果反馈，便于调试 agentic 流程。
* 加入监控／fallback 逻辑：如模型 “建议调用未知工具” 或 “多次循环” 时，系统应自动中断或请求用户确认。毕竟 agentic 模型有更高自主性但也更需安全控制。

---

## 五、示例代码（Python + FastAPI + OpenAI）

下面是一个简化的示例，演示如何通过 FastAPI 调用 GPT-5，支持工具调用和 agentic 流程。你可按需改造为 Cursor prompt 管道。

```python
from fastapi import FastAPI, Body
import os
import openai  # 假设使用 openai 官方库

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

TOOLS = [
    {
        "name": "query_database",
        "description": "Run an SQL query against our Postgres DB",
        "parameters": {
            "type": "object",
            "properties": {
                "sql": {"type": "string"}
            },
            "required": ["sql"]
        }
    },
    {
        "name": "generate_code",
        "description": "Generate code snippet in Python/JS according to spec",
        "parameters": {
            "type": "object",
            "properties": {
                "spec": {"type": "string"}
            },
            "required": ["spec"]
        }
    }
    # … 更多工具
]

@app.post("/agent-run")
async def agent_run(task: str = Body(..., media_type="application/json")):
    # 构造 prompt +请求参数
    prompt = f"""
    You are an autonomous agent AI.  
    Tools available:
    {TOOLS}
    Task: {task}
    """
    response = await openai.ChatCompletion.acreate(
        model="gpt-5",
        messages=[{"role":"user","content":prompt}],
        # 以下为 GPT-5 特有参数
        reasoning_effort="high",
        textVerbosity="medium",
        tools=TOOLS,
        # 如果用了 Responses API，还可传 previous_response_id
    )
    # 处理模型可能返回的工具调用建议
    # …（伪代码）…
    return {"response": response.choices[0].message.content}
```

你可在这个基础上扩展：

* 检查 `response` 是否含 “tool_call” 动作，如果有，提取工具名、参数，由你系统执行，再将结果反馈给模型。
* 记录每次调用历史，用于传入下一次调用。
* 将 prompt 模板模块化（Cursor 管理）以便复用。

---

## 六、注意事项与风险／限制

* 虽然 GPT-5 功能强大，但仍有模型偏差、工具调用错误、生成代码漏洞等风险。你必须设计监控、验证机制。
* 模型升级或 API 改版可能破坏已有逻辑（如曾有文章指出 GPT-5 发布时 API 调整造成许多应用停止工作） ([Docker][6])
* Agentic 系统若不设限制，模型可能“过度积极”调用工具或误用脚本。务必设定预算／约束。
* 对于你在中国大陆需考虑的合规／访问问题，确保 API 调用路径、数据隐私、模型服务许可均合法可用。
* 在多步骤流程中，token 消耗可能显著。合理控制 `reasoning_effort` 与上下文长度。

