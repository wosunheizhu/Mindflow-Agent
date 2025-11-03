下面给你一份**可直接给 agent 用**的 Carbone（Cloud / 自托管均可）端到端调用指南：覆盖**模板上传 → 渲染 → 下载/回调 → ODP/PPTX 最佳实践 → 循环/条件/图片**等要点，并附上**cURL / Node / Python**最小可用示例与**失败回退**。

---

# 0. 你要记住的 3 个事实

1. **模板先行**：Carbone 用你做好的模板（PPTX/ODP/…）+ JSON 数据合成成品。([carbone.io][1])
2. **PPTX 的限制**：**PPTX 不能动态新增幻灯片**；需要循环/增页时用 **ODP 模板** 再**转换为 PPTX**，更稳。([carbone.io][2])
3. **API 3 招**：**上传模板** → **渲染（/render）** → **下载（GET /render 或一次性下载 ?download=true）**。([carbone.io][3])

---

# 1) 认证与版本头

* Cloud：在 Carbone 控制台创建 **API Token**，发请求时加 `Authorization: Bearer <TOKEN>`；并加 `carbone-version: 4`（或 5，按你开通的版本）。([carbone.io][4])
* On-Prem：同一套 HTTP API，默认可直接访问（也可自行加认证）。([carbone.io][4])

---

# 2) 上传模板（获得 `templateId`）

**HTTP**

```bash
curl -X POST 'https://api.carbone.io/template' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'carbone-version: 4' \
  -H 'Accept: application/json' \
  -F 'template=@/path/to/your-template.odp'   # 或 .pptx/.docx 等
# → 返回 {"success": true, "data": {"templateId": "TEMPLATE_ID"}}
```

* 也支持 base64 体、版本化（`versioning`、`id`）等扩展参数。([carbone.io][3])

---

# 3) 渲染（模板 + 数据 → 成品）

**方式 A：两步（渲染→再下载）**

```bash
# 3.1 渲染
curl -X POST "https://api.carbone.io/render/TEMPLATE_ID" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "carbone-version: 4" \
  -H "Content-Type: application/json" \
  -d '{
        "data": { "title": "你好，世界", "bullets": ["要点1","要点2"] },
        "convertTo": "pptx"      // ODP 模板渲染后直接转成 PPTX
      }'
# → 返回 {"success": true, "data": {"renderId": "RENDER_ID"}}

# 3.2 下载
curl -L -X GET "https://api.carbone.io/render/RENDER_ID" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "carbone-version: 4" \
  --output deck.pptx
```

**方式 B：一步直下（渲染并直接返回文件）**

```bash
curl -L -X POST "https://api.carbone.io/render/TEMPLATE_ID?download=true" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "carbone-version: 4" \
  -H "Content-Type: application/json" \
  -d '{ "data": { "title": "一步直下" }, "convertTo": "pptx" }' \
  --output deck.pptx
```

> `?download=true` 适合 agent：**单次调用拿到文件流**，无需再次 GET。([carbone.io][5])
> `/render` 的请求体里常用字段：`data`（JSON）、`convertTo`（目标格式，如 `pptx/pdf`）。官方 Postman/OpenAPI 里有同样示例。([Postman][6])

---

# 4) 在模板里怎么写占位与逻辑（PPT 关键招）

## 4.1 文本占位

* 直接写 `{title}`、`{company.name}`，渲染时用 JSON 替换。([carbone.io][1])

## 4.2 循环/增页（**用 ODP 模板**）

* PPTX **不能动态加页**；有循环需求时，用 **ODP** 做模板，通过 **循环**复制内容/位移元素，再 **convertTo: "pptx"**。([carbone.io][2])
* 循环语法：在可重复的块中写 `{d[i].field}`，或者表格循环等（多维循环在部分格式实验性，报表场景建议 ODP/DOCX/HTML/MD）。([carbone.io][7])
* 在演示文稿里元素是**绝对定位**，循环时元素可能重叠；用 **`:transform` 格式器**按 X/Y 轴位移（如每条往下偏移一定像素/厘米）。([carbone.io][2])

## 4.3 条件展示

* **行内条件**、**区块条件**与**智能条件**三类（如 `ifEQ`/`gt`/`lt` 等）。适合按数据显隐一段文本/一张图/一个表格行。([carbone.io][8])

## 4.4 动态图片（LOGO、海报等）

* 在模板里先放一张**临时占位图**，把 **Carbone 标签写在“替代文字(alt)”** 里，例如把 alt 写成 `{heroImg|imageFit("contain")}`；渲染时可传 **公网 URL** 或 **base64 Data URI**。([carbone.io][9])

---

# 5) Webhook 与队列（可选）

* 渲染任务多时可用 **Webhook** 回调你的服务；也可自定义回调请求头（如 `carbone-webhook-header-authorization: my-secret`），Carbone 回调时会带上对应头。([carbone.io][4])

---

# 6) 自托管（On-Prem）要点

* 官方 **Docker** 部署，生产建议把 `/app/template`（单实例）或加上 `/app/render`（多实例）绑定到持久卷；便于多副本与文件持久化。([carbone.io][10])

---

# 7) 代码最小样例（可直接嵌到你的 agent 工具）

## 7.1 Node.js（fetch 版）

```js
// 1. 上传模板
const fd = new FormData();
fd.append('template', fs.createReadStream('/path/tpl.odp'));
const up = await fetch('https://api.carbone.io/template', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'carbone-version': '4' },
  body: fd
});
const { data: { templateId } } = await up.json();

// 2. 一步直下渲染为 PPTX（推荐给 agent）
const r = await fetch(`https://api.carbone.io/render/${templateId}?download=true`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'carbone-version': '4',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data: { title: 'Hello', bullets: ['A','B'] },
    convertTo: 'pptx'
  })
});
fs.writeFileSync('deck.pptx', Buffer.from(await r.arrayBuffer()));
```

（端点/头/一次性下载与上文一致）([Postman][6])

## 7.2 Python（requests 版）

```python
import requests, json

BASE = "https://api.carbone.io"
HEAD = {"Authorization": f"Bearer {TOKEN}", "carbone-version": "4"}

# 1) 上传模板
files = {"template": open("tpl.odp","rb")}
up = requests.post(f"{BASE}/template", headers=HEAD, files=files)
template_id = up.json()["data"]["templateId"]

# 2) 渲染并直接下载
payload = {"data": {"title": "你好"}, "convertTo": "pptx"}
r = requests.post(f"{BASE}/render/{template_id}?download=true",
                  headers={**HEAD, "Content-Type":"application/json"},
                  data=json.dumps(payload))
open("deck.pptx","wb").write(r.content)
```

([Postman][6])

## 7.3 cURL（最少命令）

```bash
# 上传
curl -s -X POST 'https://api.carbone.io/template' \
  -H 'Authorization: Bearer '"$TOKEN" \
  -H 'carbone-version: 4' \
  -H 'Accept: application/json' \
  -F 'template=@tpl.odp'

# 一步直下渲染下载
curl -L -s -X POST "https://api.carbone.io/render/TEMPLATE_ID?download=true" \
  -H "Authorization: Bearer $TOKEN" \
  -H "carbone-version: 4" \
  -H "Content-Type: application/json" \
  -d '{"data":{"title":"一键下载"},"convertTo":"pptx"}' \
  --output deck.pptx
```

([Postman][6])

---

# 8) Agent 工具入参/返回（建议 Schema）

**入参**

```json
{
  "templateSource": {"type":"upload|id"},
  "templateId": "可选，templateSource=id 时必填",
  "fileUrl": "可选，支持从URL拉取模板再上传",
  "data": { "title": "文本", "items": [] },
  "convertTo": "pptx",
  "downloadInline": true,   // true → 使用 ?download=true
  "webhook": {
    "url": "可选",
    "headers": { "authorization": "my-secret" }
  }
}
```

**返回**

```json
{
  "ok": true,
  "fileName": "deck.pptx",
  "mime": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "bytes": "<base64>",     // 或直传你的对象存储后的URL
  "meta": { "templateId": "xxx", "renderId": "yyy" }
}
```

* 如失败：返回 `{ok:false, code, message, details}`。**常见错误**：权限/Token、模板未共享（自托管无此问题）、PPTX 循环导致重叠等。([carbone.io][2])

---

# 9) 失败回退与美观度保障

* **循环/增页**：检测到 `items.length > N` → 自动切到 **ODP 模板** 渲染 → `convertTo: "pptx"`。([carbone.io][2])
* **元素重叠**：在模板里为可重复元素链上 `:transform(x,y)` 位移。([carbone.io][2])
* **图片失效**：URL 改为 base64 Data URI；或启用对象存储 CDN。([carbone.io][9])
* **下载链路**：优先 `?download=true`（最少调用）；若超时，用两步法（POST 渲染 → 轮询 GET /render）。([carbone.io][5])

---

# 10) 你可以立刻做的模板规范（建议）

* 标题：`{title}`；副标题：`{subtitle}`；要点：`{bullets[i]}`；图片 alt：`{hero|imageFit("contain")}`。([carbone.io][9])
* 数据页循环（ODP）：在一页内放可重复块，用 `{items[i].name}`、`{items[i].value}`；跨多页时用多页母版 + `:transform` 控制位移或复制页（ODP 更稳）。([carbone.io][2])
* 条件：`{=ifEQ(status,"good"):show}` 包裹一段区块或用智能条件隐藏整行。([carbone.io][8])

---

需要的话，我可以把你现有的**一份 PPTX 模板**快速改成**ODP + Carbone 占位**版本，并给出**对照 JSON**与**自动化测试数据**，这样你的 agent 就能**稳定批量**产出“**无需修复的、美观的一致风格**”的 `.pptx`。

[1]: https://carbone.io/documentation/design/overview/getting-started.html?utm_source=chatgpt.com "Design your first template"
[2]: https://carbone.io/documentation/design/overview/template-feature.html?utm_source=chatgpt.com "Supported template files and features"
[3]: https://carbone.io/documentation/developer/http-api/manage-templates.html?utm_source=chatgpt.com "Upload and manage templates"
[4]: https://carbone.io/documentation/developer/http-api/introduction.html?utm_source=chatgpt.com "Introduction to Carbone APIs"
[5]: https://carbone.io/documentation/developer/http-api/generate-reports.html?utm_source=chatgpt.com "Generate reports"
[6]: https://www.postman.com/carbone-official/carbone-io/documentation/pwooiut/carbone-api-v4-document-generator?entity=request-28670646-420fe63a-8971-4581-b83a-33697bdf7212&utm_source=chatgpt.com "Carbone API V4 - Document generator"
[7]: https://carbone.io/documentation/design/repetitions/with-arrays.html?utm_source=chatgpt.com "Repeat any part of you document with a loop on arrays"
[8]: https://carbone.io/documentation/design/conditions/overview.html?utm_source=chatgpt.com "How to add conditions to your templates?"
[9]: https://carbone.io/documentation/design/advanced-features/pictures.html?utm_source=chatgpt.com "How to integrate dynamic pictures in your template?"
[10]: https://carbone.io/documentation/developer/self-hosted-deployment/deploy-with-docker.html?utm_source=chatgpt.com "Deploy with Docker"
