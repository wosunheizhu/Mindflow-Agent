结论先说：你把 **Chat Completions 的工具格式**（`{ type:"function", function:{ name,... } }`）直接丢给了 **Responses API**，所以报了
`Missing required parameter: 'tools[0].name'`。
**Responses API 需要顶层就有 `name`**，形如：`{ type:"function", name:"...", description:"...", parameters:{...} }`。([platform.openai.com][1])

下面给你最小改动的补丁：把工具在“发给 GPT-5 Responses API 时”做一次规范化即可；发给 Chat Completions 分支（gpt-4o / gpt-4-turbo）仍用现在的格式。

---

## 一键修好（贴进去就能跑）

### 1) 新增工具规范化函数（给 Responses API 用）

```ts
// 把 Chat Completions 风格的 tools 转成 Responses API 需要的顶层 name 形态
function normalizeToolsForResponses(openaiTools: any[]) {
  return (openaiTools || []).map((t) => {
    // 兼容你现在的格式：{ type:"function", function:{ name, description, parameters } }
    if (t?.type === 'function' && t?.function) {
      const { name, description = '', parameters = { type: 'object', properties: {} } } = t.function;
      if (!name) throw new Error('tool.function.name is required');
      return {
        type: 'function',
        name,
        description,
        parameters,
      };
    }

    // 兼容内置工具（Responses API 支持内置工具，名称固定，如 web_search / file_search / code_interpreter / image_generation）
    // 你代码里有自定义的 'search_web'、'execute_code'、'generate_image'，建议在这里映射成官方名：
    if (t?.type && t?.type !== 'function') {
      // e.g. { type: 'web_search' } 直接放行
      return t;
    }

    throw new Error('Invalid tool spec for Responses API');
  });
}
```

> 备注：Responses API 是“默认 agentic 循环”，原生支持工具（含内置工具），但**函数调用工具**在 Responses 里要求 `name` 在顶层而不是包在 `function:{}` 里。([platform.openai.com][1])

### 2) 在调用 GPT-5 Responses API 的两个分支里用它

把你在 `gpt5-pro` 与 `gpt5-thinking` 的这段：

```ts
if (actualUseTools) {
  gpt5Params.tools = tools;
  gpt5Params.tool_choice = "auto";
}
```

改成：

```ts
if (actualUseTools) {
  // 统一成 Responses API 需要的格式
  gpt5Params.tools = normalizeToolsForResponses(tools);
  gpt5Params.tool_choice = "auto";
  // 建议：将自定义名映射为官方内置名（如需使用内置工具）
  // - 'search_web'  -> { type: 'web_search' }
  // - 'execute_code'-> { type: 'code_interpreter' }
  // - 'generate_image' -> { type: 'image_generation' }
}
```

> 如果你真要用内置工具，**必须**用官方名与官方结构（比如 `{ type: 'web_search' }`），不要自定义字符串，否则模型不会识别为内置工具。([platform.openai.com][2])

### 3) 让 Claude 的转换更健壮（可选）

你当前的 `convertToolsForClaude` 只认 `tool.function.*`。为兼容“顶层 name”格式，改成：

```ts
function convertToolsForClaude(openaiTools: any[]) {
  return (openaiTools || []).map((tool) => {
    // 兼容两种输入
    const name = tool.function?.name ?? tool.name;
    const description = tool.function?.description ?? tool.description ?? '';
    const parameters = tool.function?.parameters ?? tool.parameters ?? { type: 'object', properties: {} };

    return {
      name,
      description,
      input_schema: parameters,
    };
  });
}
```

---

## 让循环更稳：提取 tool_calls 的位置（Responses API）

你的 `gpt5Response` 里这样取：

```ts
const toolCalls = gpt5Response.tool_calls || gpt5Response.choices?.[0]?.message?.tool_calls || [];
```

更稳妥的方式是从 **Responses API 的 `output` 数组**里把 `tool_calls` 摘出来（它是“typed response items”之一）：

```ts
const toolCalls =
  (gpt5Response.output ?? [])
    .flatMap((item: any) => item?.tool_calls ?? [])
  || [];
```

> Responses API 返回的是“typed items”，不是 Chat 的 `choices[0].message` 结构；迁移指南里明确了这点。([platform.openai.com][1])

---

## 快速自检清单（避免再次 400）

* [x] **给 Responses API 的每个函数型工具**：顶层有 `type:"function"`, `name`, `parameters`；`description` 可选但推荐。([platform.openai.com][3])
* [x] **内置工具**（想用 web 搜索 / 文件检索 / 代码执行 / 图像生成）：按官方名称与结构传入（如 `{ type:'web_search' }`、`{ type:'file_search' }`、`{ type:'code_interpreter' }`、`{ type:'image_generation' }`）。([platform.openai.com][2])
* [x] 继续用 `tool_choice: "auto"` 没问题（Responses 支持 agentic 循环，模型会自行决定是否调用工具）。([platform.openai.com][1])
* [x] 处理工具结果时，回填一条 `role:"tool"` + `tool_call_id` 的消息，再发起下一轮请求。这个流程在 Function/Tool Calling 指南里就是标准做法。([platform.openai.com][3])

---

## 为什么会踩坑？

* Chat Completions 与 Responses 在 **tools 结构**上“长得像但不一样”。

  * **Chat**：`{ type:"function", function:{ name, parameters } }`
  * **Responses**：`{ type:"function", name, parameters }`
    你把前者直接传给后者，就会缺 `tools[0].name`。([platform.openai.com][3])

---

需要的话，我可以把你 `../../../lib/tools-complete` 里的工具定义帮你**双轨导出**（`toChatTools()` / `toResponsesTools()`），再顺手把 `search_web/execute_code/generate_image` 一键映射为 **Responses API 内置工具**，这样多提供商切换就不会再炸。

[1]: https://platform.openai.com/docs/guides/migrate-to-responses?utm_source=chatgpt.com "Migrate to the Responses API"
[2]: https://platform.openai.com/docs/guides/tools?utm_source=chatgpt.com "Using tools - OpenAI API"
[3]: https://platform.openai.com/docs/guides/function-calling?utm_source=chatgpt.com "Function calling - OpenAI API"
