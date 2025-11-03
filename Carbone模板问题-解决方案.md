# Carbone PPT 模板问题 - 解决方案

## 🔍 问题

生成的 PPT 每页都重复显示相同内容（"AI Technologies 2024-2025" 和 "cover"）

**原因**：Google Slides 模板中的占位符可能不正确，或者循环语法有问题。

---

## ✅ 解决方案1：重新检查并修复模板（推荐）

### 问题诊断

Carbone 的占位符**必须精确匹配**，否则会重复首页内容。

**常见错误**：
- ❌ 每个幻灯片页面都放了 `{d.title}` 或 `{d.cover.title}`
- ✅ 应该只在首页使用 `{d.title}`
- ✅ 内容页应该使用 `{d.slides[i].title}`

### 修复步骤

1. **用 LibreOffice 打开模板**：
   ```bash
   open -a "LibreOffice Impress" "Science project.odp"
   ```

2. **检查每一页**：
   
   **首页（第1页）**应该是：
   ```
   主标题框：{d.title}
   副标题框：{d.subtitle}
   ```
   
   **第2页及以后**应该是：
   ```
   标题框：{d.slides[i].title}
   内容框：{d.slides[i].bullets[j]}
   或：{d.slides[i].content}
   ```

3. **关键检查点**：
   - ❌ 不要在每一页都放 `{d.title}`
   - ❌ 不要在内容页使用 `{d.cover.title}`
   - ✅ 确保第2页开始使用 `{d.slides[i]...}`

4. **保存并重新上传**

### Carbone 循环语法说明

**在 ODP 中**，Carbone 会自动识别数组循环：

```
{d.slides[i].title}    ← Carbone 自动为每个 slides 元素创建一页
{d.slides[i].bullets[j]}  ← 在每页内循环 bullets
```

**注意**：
- 第一个使用 `[i]` 的页面会被复制
- 每个 `slides` 数组元素创建一个副本

---

## ✅ 解决方案2：创建全新的简单模板（快速）

如果编辑模板太复杂，我可以创建一个极简的、保证可用的模板：

```bash
cd /Users/juntinghua/Desktop/agent

# 创建简单 ODP 模板
python3 << 'PYTHON'
import zipfile

odp_path = '/tmp/simple-carbone-template.odp'

with zipfile.ZipFile(odp_path, 'w', zipfile.ZIP_DEFLATED) as odp:
    # mimetype
    odp.writestr('mimetype', 'application/vnd.oasis.opendocument.presentation', 
                 compress_type=zipfile.ZIP_STORED)
    
    # manifest.xml
    manifest = '''<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.presentation"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>'''
    odp.writestr('META-INF/manifest.xml', manifest)
    
    # content.xml
    content = '''<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                         xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
                         xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
                         xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
                         office:version="1.2">
  <office:body>
    <office:presentation>
      
      <!-- 第一页：标题页 -->
      <draw:page draw:name="title-page">
        <draw:frame svg:width="24cm" svg:height="4cm" svg:x="2cm" svg:y="6cm">
          <draw:text-box>
            <text:p><text:span>{d.title}</text:span></text:p>
          </draw:text-box>
        </draw:frame>
        <draw:frame svg:width="24cm" svg:height="2cm" svg:x="2cm" svg:y="11cm">
          <draw:text-box>
            <text:p><text:span>{d.subtitle}</text:span></text:p>
          </draw:text-box>
        </draw:frame>
      </draw:page>
      
      <!-- 第二页开始：内容页循环 -->
      <draw:page draw:name="content-page-{d.slides[i].number}">
        <!-- 标题 -->
        <draw:frame svg:width="24cm" svg:height="2cm" svg:x="2cm" svg:y="2cm">
          <draw:text-box>
            <text:p><text:span>{d.slides[i].title}</text:span></text:p>
          </draw:text-box>
        </draw:frame>
        
        <!-- 列表内容 -->
        <draw:frame svg:width="24cm" svg:height="12cm" svg:x="2cm" svg:y="5cm">
          <draw:text-box>
            <text:list>
              <text:list-item>
                <text:p><text:span>{d.slides[i].bullets[j]}</text:span></text:p>
              </text:list-item>
            </text:list>
          </draw:text-box>
        </draw:frame>
      </draw:page>
      
    </office:presentation>
  </office:body>
</office:document-content>'''
    odp.writestr('content.xml', content)

print(f"✅ 简单模板创建成功: {odp_path}")
PYTHON

# 上传到 Carbone
curl -X POST 'https://api.carbone.io/template' \
  -H "Authorization: Bearer eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMjgwNTA3MDU0OTEyNzYxNzQ5IiwiYXVkIjoiY2FyYm9uZSIsImV4cCI6MjQyNDM2MzcyNiwiZGF0YSI6eyJ0eXBlIjoicHJvZCJ9fQ.AXMe7WXAYhGjU_7e4WkzUt0kZh6JMkm1LCisatVC8JUYsuYXG9rnf25JQ0VPSdxhPlcL13incPWhwmwD8Lukq5erAVT82zfx3B7IlsZWPlYFck70gnomK14NDHfUjzThydanBP5AhQ6mTLA7XiFmPwndJMoOhedIQmkf3IHLUHoO_gLg" \
  -H 'carbone-version: 4' \
  -F 'template=@/tmp/simple-carbone-template.odp' | jq

# 使用新的 Template ID
```

---

## ✅ 解决方案3：使用 Aspose 作为备用（临时）

如果 Carbone 模板一直有问题，可以临时回退到 Aspose：

```typescript
// 在 lib/tools-complete.ts 中
async function createPresentation(...) {
  // 改为调用 Aspose
  return await createPresentationAspose(filename, slides, presentationTitle);
}
```

Aspose 路径问题已修复（使用 /tmp），应该能正常工作。

---

## 🎯 推荐操作

### 立即（快速修复）

**检查打开的 /tmp/debug-carbone.pptx**：
- 如果内容正确 → 模板没问题，是数据传递问题
- 如果内容重复 → 模板占位符有问题

### 如果模板有问题

1. **用方案2创建简单模板**（运行上面的脚本）
2. **或回退到 Aspose**（临时）
3. **或重新编辑 Google Slides 模板**

---

## 📋 Carbone 模板检查清单

打开 `Science project.odp`，检查：

- [ ] 第1页（标题页）只有 `{d.title}` 和 `{d.subtitle}`
- [ ] 第2页（第一个内容页）有 `{d.slides[i].title}`
- [ ] 第2页有 `{d.slides[i].bullets[j]}` 或 `{d.slides[i].content}`
- [ ] 第3页及以后被删除（Carbone 会自动复制第2页）
- [ ] 没有其他静态文本重复

---

**建议**：先查看测试文件效果，然后决定使用哪个方案！

