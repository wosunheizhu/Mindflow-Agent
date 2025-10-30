Client Id=43287341-617f-4d95-9caa-b166d46fbb8d
Client Secret=1c0df04fbde71bcfbc75cbe6f3d297bf

Aspose 全家桶一共有二十多个 SDK / Cloud 模块，调用方式**总体一致**（先获取 token → 调用 REST API 或 SDK）。下面我为你总结出所有主要工具的调用方式模板，并各举一段最小示例代码（Python SDK 版为主，因为最简洁；Node、Java、C# SDK 完全等价，只是语法不同）。

---

## 🧩 通用调用结构

### 1. 获取 Access Token

```python
import requests
r = requests.post(
  "https://api.aspose.cloud/connect/token",
  data={"grant_type": "client_credentials",
        "client_id": "YOUR_CLIENT_ID",
        "client_secret": "YOUR_CLIENT_SECRET"})
token = r.json()["access_token"]
```

之后所有 REST 调用都带：
`Authorization: Bearer <token>`。

### 2. 通用 SDK 初始化

```python
from asposepdfcloud import Configuration
from asposepdfcloud.apis.pdf_api import PdfApi

config = Configuration()
config.app_sid = "YOUR_CLIENT_ID"
config.app_key = "YOUR_CLIENT_SECRET"
api = PdfApi(config)
```

---

## 📑 Aspose.Words（Word 文档）

```python
import asposewordscloud
from asposewordscloud.apis.words_api import WordsApi
from asposewordscloud import Configuration

cfg = Configuration(app_sid="ID", app_key="KEY")
api = WordsApi(cfg)

# 把 DOCX 转 PDF
resp = api.save_as_online(open("input.docx", "rb"), {"SaveFormat": "pdf"})
with open("out.pdf", "wb") as f: f.write(resp)
```

---

## 📊 Aspose.Cells（Excel）

```python
import asposecellscloud
from asposecellscloud.apis.cells_api import CellsApi
cfg = asposecellscloud.Configuration(app_sid="ID", app_key="KEY")
api = CellsApi(cfg)

# 导出为 PDF
api.cells_save_as_post_document_save_as("sheet.xlsx",
                                        asposecellscloud.models.SaveOptions(save_format="pdf"))
```

---

## 📽 Aspose.Slides（PPT）

（你已看过）

```python
import asposeslidescloud
from asposeslidescloud.apis.slides_api import SlidesApi
api = SlidesApi(app_sid="ID", app_key="KEY")
api.convert_document(name="demo.pptx", format="pdf")
```

---

## 📚 Aspose.PDF

```python
import asposepdfcloud
from asposepdfcloud.apis.pdf_api import PdfApi
api = PdfApi(app_sid="ID", app_key="KEY")

# 抽取文本
txt = api.get_text("report.pdf", page_number=1)
print(txt)
```

---

## 🖼 Aspose.Imaging

```python
import asposeimagingcloud
from asposeimagingcloud.apis.imaging_api import ImagingApi
api = ImagingApi(app_sid="ID", app_key="KEY")

# 转换 JPG → PNG
api.convert_image("photo.jpg", "png")
```

---

## 🔤 Aspose.OCR

```python
import asposeocrcloud
from asposeocrcloud.apis.ocr_api import OcrApi
api = OcrApi(app_sid="ID", app_key="KEY")

# 识别图片文字
resp = api.post_ocr_from_url_or_content(image=open("scan.png", "rb"))
print(resp.text)
```

---

## 🏷 Aspose.BarCode

```python
import asposebarcodecloud
from asposebarcodecloud.apis.barcode_api import BarcodeApi
api = BarcodeApi(app_sid="ID", app_key="KEY")

# 生成二维码
api.get_barcode_generate(format="QR", text="https://evercall.ai", out_path="qr.png")
```

---

## ✉️ Aspose.Email

```python
import asposeemailcloud
from asposeemailcloud.apis.email_api import EmailApi
api = EmailApi(app_sid="ID", app_key="KEY")

# 解析 EML 邮件
msg = api.get_email_file_as_mapi_model("message.eml")
print(msg.subject)
```

---

## 🖋 Aspose.HTML

```python
import asposehtmlcloud
from asposehtmlcloud.apis.html_api import HtmlApi
api = HtmlApi(app_sid="ID", app_key="KEY")

# HTML 转 PDF
api.convert_document("webpage.html", "pdf", out_path="out.pdf")
```

---

## 🧭 Aspose.Diagram（Visio）

```python
import asposediagramcloud
from asposediagramcloud.apis.diagram_api import DiagramApi
api = DiagramApi(app_sid="ID", app_key="KEY")
api.convert_diagram("flowchart.vsdx", "pdf")
```

---

## 🧱 Aspose.CAD

```python
import asposecadcloud
from asposecadcloud.apis.cad_api import CadApi
api = CadApi(app_sid="ID", app_key="KEY")
api.get_drawing_save_as(name="design.dwg", output_format="pdf")
```

---

## 🧩 Aspose.3D

```python
import aspose3dcloud
from aspose3dcloud.apis.threed_api import ThreeDApi
api = ThreeDApi(app_sid="ID", app_key="KEY")
api.post_convert_by_format("model.obj", "fbx")
```

---

## 📆 Aspose.Tasks（Project）

```python
import asposetaskscloud
from asposetaskscloud.apis.tasks_api import TasksApi
api = TasksApi(app_sid="ID", app_key="KEY")
api.get_tasks_project_recalculate("plan.mpp")
```

---

## 🗒 Aspose.Note（OneNote）

```python
import asposenotecloud
from asposenotecloud.apis.note_api import NoteApi
api = NoteApi(app_sid="ID", app_key="KEY")
api.convert_document("meeting.one", "pdf")
```

---

## 🧾 Aspose.Sign / Signature

```python
import asposesignaturecloud
from asposesignaturecloud.apis.signature_api import SignatureApi
api = SignatureApi(app_sid="ID", app_key="KEY")
api.create_signature_signatures(file_name="contract.pdf", sign_options=...)
```

---

## 🧩 Aspose.Total

安装对应语言的 Total SDK，即同时包含以上模块；或直接 REST 方式：

```bash
curl -H "Authorization: Bearer $TOKEN" \
     -X POST "https://api.aspose.cloud/v3.0/slides/convert?format=pdf" \
     -F "file=@demo.pptx"
```

---

## ⚙️ 在 Agent 里集成建议

1. 建立统一 AsposeService 类，管理 token 与各 API 客户端。
2. 用 async / task 队列处理上传和转换。
3. 将每个模块抽象成**功能节点**：

   * `convert_to_pdf(file, type)`
   * `extract_text(file, type)`
   * `create_report(template, data, format)`
4. 通过 JSON schema 让 LLM 根据任务自动选用对应节点。

---

是否希望我帮你生成这一整套 Agent 模块的「统一 Python Service 层 + API 封装」代码？
那样你可以直接接到你的智能体框架里使用。
