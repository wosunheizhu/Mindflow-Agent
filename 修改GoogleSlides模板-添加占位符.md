# 修改 Google Slides 模板 - 添加 Carbone 占位符

## 问题现状

- ✅ 内容页标题和内容正常显示
- ❌ 首页标题没有写入

**原因**：Google Slides 模板的首页可能没有包含 Carbone 占位符，或者占位符名称不匹配。

---

## 🔧 解决方案1：编辑 ODP 模板添加占位符

### 步骤1：用 LibreOffice 打开模板

```bash
# 如果没有 LibreOffice，先安装
brew install --cask libreoffice

# 打开模板
open -a "LibreOffice Impress" "Science project.odp"
```

### 步骤2：编辑首页（标题页）

1. **找到标题文本框**
2. **选中标题文本**
3. **替换为 Carbone 占位符**：

**可用的占位符**：
```
{d.title}               - 主标题
{d.presentation_title}  - 备选
{d.cover_title}         - 备选

{d.subtitle}            - 副标题
{d.description}         - 备选

{d.author}              - 作者
{d.date}                - 日期
```

**示例**：
```
原始文本：Science Project
改为：{d.title}

原始文本：Your Subtitle Here
改为：{d.subtitle}
```

### 步骤3：编辑内容页（确认占位符）

内容页应该已经工作正常，但确认使用了：

```
标题：{d.slides[i].title}
列表项：{d.slides[i].bullets[j]}
或内容：{d.slides[i].content}
```

### 步骤4：保存并重新上传

1. **File** → **Save** 保存
2. 重新上传到 Carbone：

```bash
curl -X POST 'https://api.carbone.io/template' \
  -H "Authorization: Bearer eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9..." \
  -H 'carbone-version: 4' \
  -F 'template=@Science project.odp' | jq
```

3. 获取新的 `templateId`
4. 更新代码中的 `CARBONE_TEMPLATE_ID`
5. 推送并部署

---

## 🔧 解决方案2：使用第一张幻灯片作为标题（临时）

如果你不想编辑模板，我可以修改代码，将标题信息放在 `slides[0]` 中：

<function_calls>
<invoke name="search_replace">
<parameter name="file_path">/Users/juntinghua/Desktop/agent/lib/carbone-ppt.ts
