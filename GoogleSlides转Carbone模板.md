# Google Slides 转 Carbone 模板指南

## 📋 将 Google Slides 模板转换为 Carbone 可用格式

### 方法1：导出为 ODP（推荐）

#### 步骤1：选择 Google Slides 模板

1. 访问 Google Slides 模板库：
   - https://docs.google.com/presentation/u/0/?tgif=d
   - 或搜索 "google slides templates"

2. 选择一个专业的模板（例如商务、科技、教育类）

3. 点击 "使用模板" 创建副本

#### 步骤2：编辑模板，添加 Carbone 占位符

1. 在标题处，替换为：`{d.title}`
2. 在副标题处，替换为：`{d.subtitle}`
3. 在内容页：
   - 标题：`{d.slides[i].title}`
   - 列表项：`{d.slides[i].bullets[j]}`

**示例**：

**原始 Google Slides**：
```
标题：Your Presentation Title
副标题：Your Subtitle Here
```

**改为 Carbone 格式**：
```
标题：{d.title}
副标题：{d.subtitle}
```

#### 步骤3：导出为 ODP

1. **File** → **Download** → **ODP Document (.odp)**
2. 保存到本地，例如：`my-template.odp`

#### 步骤4：上传到 Carbone

```bash
curl -X POST 'https://api.carbone.io/template' \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H 'carbone-version: 4' \
  -F 'template=@my-template.odp'

# 获得 templateId
```

#### 步骤5：保存 Template ID

将返回的 `templateId` 保存为环境变量：

**本地**（.env.local）：
```bash
CARBONE_PPT_TEMPLATE_ID=你的templateId
```

**Vercel**：
Settings → Environment Variables → Add:
```
CARBONE_PPT_TEMPLATE_ID=你的templateId
```

---

### 方法2：使用现成的 ODP 模板

如果不想从 Google Slides 转换，可以直接使用 LibreOffice 模板：

#### 下载 LibreOffice Impress 模板

1. 访问：https://templates.libreoffice.org/
2. 选择 "Presentations"
3. 下载 .otp 或 .odp 文件

#### 编辑模板

1. 用 LibreOffice Impress 打开
2. 添加 Carbone 占位符：
   - `{d.title}`
   - `{d.slides[i].title}`
   - `{d.slides[i].bullets[j]}`

3. 另存为 .odp

#### 上传到 Carbone

同方法1步骤4

---

### 方法3：使用我已创建的 ODP 模板（最快）

我已经创建并上传了一个基础的 ODP 模板：

```
Template ID: 4e8cd3240e5a00b02fb4cf91cfd55b22915146b89e56a4b9848ad68b12818edd
状态: ✅ 已测试，生成25KB PPTX
格式: 标准 ODP → PPTX
```

**特点**：
- ✅ 标题页（标题 + 副标题）
- ✅ 内容页循环（每页有标题和列表）
- ✅ 支持无限幻灯片
- ✅ 支持每页无限列表项

**使用**：
已配置在代码中，直接使用即可（等待 Vercel 部署）

---

## 🎨 Carbone 占位符语法参考

### 基础占位符
```
{d.title}          - 演示文稿标题
{d.subtitle}       - 副标题
{d.author}         - 作者
{d.date}           - 日期
```

### 循环（幻灯片）
```
{d.slides[i].title}           - 第 i 页的标题
{d.slides[i].content}         - 第 i 页的内容
{d.slides[i].bullets[j]}      - 第 i 页的第 j 个要点
```

### 条件显示
```
{d.showChart:ifEQ(true)}      - 如果 showChart=true 才显示
{d.slides[i]:show()}          - 显示这一页
```

### 位移（避免重叠）
```
{d.slides[i].title:transform(0,2cm)}  - Y轴向下偏移2cm
```

---

## 📊 数据格式示例

```json
{
  "data": {
    "title": "AI 技术报告",
    "subtitle": "2024-2025",
    "slides": [
      {
        "number": 1,
        "title": "大语言模型",
        "bullets": ["突破点1", "突破点2", "突破点3"]
      },
      {
        "number": 2,
        "title": "多模态 AI",
        "bullets": ["特点A", "特点B"]
      }
    ]
  },
  "convertTo": "pptx"
}
```

---

## 🔧 自定义模板步骤（完整）

### 1. 在 Google Slides 设计模板

1. 访问：https://slides.google.com
2. 创建新演示文稿或选择模板
3. 设计你想要的样式：
   - 背景色
   - 字体
   - 布局
   - Logo（可选）

### 2. 添加占位符

在每个需要动态内容的地方，用 Carbone 占位符替换：

**标题页**：
- 主标题文本框：输入 `{d.title}`
- 副标题：输入 `{d.subtitle}`

**内容页（复制多份作为示例）**：
- 标题：`{d.slides[i].title}`
- 第一个列表项：`{d.slides[i].bullets[j]}`
- 第二个列表项删除（Carbone 会自动循环）

### 3. 导出为 ODP

**File** → **Download** → **ODP Document (.odp)**

### 4. 上传并获取 ID

```bash
curl -X POST 'https://api.carbone.io/template' \
  -H "Authorization: Bearer eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9..." \
  -H 'carbone-version: 4' \
  -F 'template=@your-template.odp'
```

复制返回的 `templateId`

### 5. 更新环境变量

在 Vercel 和 .env.local 中设置：
```
CARBONE_PPT_TEMPLATE_ID=新的templateId
```

### 6. Redeploy

---

## 🚀 当前状态

### 已完成
- ✅ 基础 ODP 模板已创建
- ✅ Template ID: 4e8cd3240e5a00b02fb4cf91cfd55b22915146b89e56a4b9848ad68b12818edd
- ✅ 测试成功（25KB PPTX，可正常打开）
- ✅ 代码已集成并推送

### 待配置
- [ ] 在 Vercel 添加环境变量：
  ```
  CARBONE_API_KEY=eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9...
  CARBONE_PPT_TEMPLATE_ID=4e8cd3240e5a00b02fb4cf91cfd55b22915146b89e56a4b9848ad68b12818edd
  ```
- [ ] Vercel Redeploy
- [ ] 测试 PPT 生成

---

## 💡 建议

### 现在（立即可用）

使用我创建的基础 ODP 模板：
- ✅ 已上传
- ✅ 已测试
- ✅ 代码已集成
- ⏳ 只需添加 Vercel 环境变量

### 未来（自定义设计）

如果想要更漂亮的模板：
1. 在 Google Slides 设计
2. 添加占位符
3. 导出为 ODP
4. 上传到 Carbone
5. 更新 Template ID

---

## 🧪 测试文件

**本地测试文件**：
- `/tmp/carbone-template.odp` - ODP 模板源文件
- `/tmp/carbone-odp-test.pptx` - 测试生成的 PPTX（25KB）

打开查看：
```bash
open /tmp/carbone-odp-test.pptx
```

应该能看到：
- 标题页
- 2 页内容（大语言模型、多模态 AI）
- 列表项正常显示

---

**立即在 Vercel 添加 Carbone 环境变量，然后 Redeploy！** 🚀

代码已完全就绪，使用真正的 ODP 模板，质量有保证！

