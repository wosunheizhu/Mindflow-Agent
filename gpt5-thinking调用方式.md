下面是一个使用 GPT‑5（简称 “gpt-5” 模型）API 的 **示例调用案例**，适用于 Python 环境。你可以据此在你的 FastAPI 后端中集成调用。该示例包含了 “reasoning effort” 和 “verbosity” 参数，用于控制“思考深度”与“输出详尽程度”。（说明：实际接口参数名称可能因版本略有差别，建议查阅官方文档。）
根据官方资料，GPT-5 支持如下新参数：`reasoning_effort`（或 `reasoning {"effort": …}` 形式）和 `text {"verbosity": …}`。([DataCamp][1])

---

### 🧑‍💻 Python 示例代码

```python
import os
from openai import OpenAI

# 从环境变量读取你的 API Key
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY", "your-api-key-here")

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

# 构造调用
response = client.responses.create(
    model="gpt-5",
    input=[  # 使用 “Responses API” 模式
        {"role": "system", "content": "你是一个编程助手。"},
        {"role": "user",   "content": "请写一个 Python 函数，用于计算斐波那契数列第 n 项。"}
    ],
    reasoning={"effort": "medium"},       # 控制思考深度：可选 minimal/low/medium/high 之一 :contentReference[oaicite:2]{index=2}
    text={"verbosity": "high"},           # 控制回答详尽程度：low/medium/high :contentReference[oaicite:3]{index=3}
    max_tokens=300                       # 你可按需调整
)

# 获取返回结果
output = response.output_text  # 注意：部分 SDK 可能名称不同，如 response.choices[0].message.content
print("模型输出：", output)
print("Token 使用情况：", response.usage)  # 检查 token 用量
```

---

### 🔍 说明

* `model="gpt-5"` 表示使用完整版 GPT-5 模型。你也可以选择 `gpt-5-mini` 或 `gpt-5-nano` 等变体（用于成本/速度权衡）([DataCamp][1])
* `reasoning={"effort": "medium"}` 控制模型在内部“思考”或“推理”的强度。选择较高（如 “high”）可让模型做更多内部思考，适合复杂任务；而 “minimal” 则用于快速简明答复。([DataCamp][1])
* `text={"verbosity": "high"}` 控制输出的详尽程度。high 意味着模型将提供丰富背景、步骤说明、注释等；low 意味着简明答案。([OpenAI Cookbook][2])
* `input=[...]` 使用一个消息列表（system + user 等角色）来提供上下文。这类似于 Chat Completions 的 “messages” 结构，但 Responses API 可能略有差别。([Analytics Vidhya][3])
* `max_tokens` 用于限制模型输出长度／成本。你可依据你的预算或 UI 需求调整。
* 建议在请求之前和之后查看 `response.usage`（如 prompt_tokens、completion_tokens、total_tokens）以监控成本。([DataCamp][1])

---

### ✅ 快速备注

* 若你的 SDK 版本较旧，可能不支持 `reasoning` 或 `text.verbosity` 参数。建议升级至支持 GPT-5 的 OpenAI SDK 版本。([OpenAI Cookbook][2])
* 如果你使用的是 Chat Completions 接口而不是 Responses API，语法可能稍有不同。例如使用 `messages` 而不是 `input`。但 GPT-5 官方建议使用 Responses API。([Analytics Vidhya][3])
* 在你的后端（例如 FastAPI）中，你可以将用户消息、上下文历史、system 提示一起打包，然后发送给 API。此示例仅为单轮示范。

---

如果你愿意，我可以 **帮你写一个完整的 FastAPI 路由示例**，展示如何在你现有架构中整合 GPT-5、携带上下文历史、并管理 `reasoning_effort` 与 `verbosity` 控制。你看要不要？

[1]: https://www.datacamp.com/tutorial/openai-gpt-5-api?utm_source=chatgpt.com "OpenAI GPT‑5 API: Hands-On With New Features | DataCamp"
[2]: https://cookbook.openai.com/examples/gpt-5/gpt-5_new_params_and_tools?utm_source=chatgpt.com "GPT-5 New Params and Tools - OpenAI Cookbook"
[3]: https://www.analyticsvidhya.com/blog/2025/08/gpt-5-api/?utm_source=chatgpt.com "How to Access GPT-5 via API? - Analytics Vidhya"
