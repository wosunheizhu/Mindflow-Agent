#!/bin/bash

# Carbone 模板上传脚本
# 用途：创建并上传一个通用的 PPT 模板到 Carbone

CARBONE_API_KEY="eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMjgwNTA3MDU0OTEyNzYxNzQ5IiwiYXVkIjoiY2FyYm9uZSIsImV4cCI6MjQyNDM2MzcyNiwiZGF0YSI6eyJ0eXBlIjoicHJvZCJ9fQ.AXMe7WXAYhGjU_7e4WkzUt0kZh6JMkm1LCisatVC8JUYsuYXG9rnf25JQ0VPSdxhPlcL13incPWhwmwD8Lukq5erAVT82zfx3B7IlsZWPlYFck70gnomK14NDHfUjzThydanBP5AhQ6mTLA7XiFmPwndJMoOhedIQmkf3IHLUHoO_gLg"

echo "🎨 创建 Carbone PPT 通用模板..."

# 创建一个 Markdown 模板（Carbone 可以转换为 PPTX）
cat > /tmp/carbone-ppt-template.md << 'EOF'
# {d.title}

{d.subtitle}

---

# {d.slides[i].title}

{d.slides[i].bullets[j]}

EOF

echo "📄 模板内容："
cat /tmp/carbone-ppt-template.md

echo ""
echo "📤 上传到 Carbone Cloud..."

# 上传模板
RESPONSE=$(curl -s -X POST 'https://api.carbone.io/template' \
  -H "Authorization: Bearer $CARBONE_API_KEY" \
  -H 'carbone-version: 4' \
  -F 'template=@/tmp/carbone-ppt-template.md')

echo ""
echo "📥 Carbone 响应："
echo "$RESPONSE" | jq '.'

# 提取 templateId
TEMPLATE_ID=$(echo "$RESPONSE" | jq -r '.data.templateId')

if [ "$TEMPLATE_ID" != "null" ] && [ -n "$TEMPLATE_ID" ]; then
    echo ""
    echo "✅ 模板上传成功！"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Template ID: $TEMPLATE_ID"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "请将以下内容添加到 .env.local:"
    echo ""
    echo "CARBONE_PPT_TEMPLATE_ID=$TEMPLATE_ID"
    echo ""
    echo "然后在 Vercel 环境变量中也添加这个变量。"
    echo ""
    
    # 保存到文件
    echo "CARBONE_PPT_TEMPLATE_ID=$TEMPLATE_ID" > .carbone.env
    echo "✅ Template ID 已保存到 .carbone.env"
else
    echo ""
    echo "❌ 模板上传失败"
    echo "错误信息: $RESPONSE"
fi

echo ""
echo "🧪 测试渲染..."

# 测试渲染
if [ "$TEMPLATE_ID" != "null" ] && [ -n "$TEMPLATE_ID" ]; then
    curl -L -X POST "https://api.carbone.io/render/${TEMPLATE_ID}?download=true" \
      -H "Authorization: Bearer $CARBONE_API_KEY" \
      -H 'carbone-version: 4' \
      -H 'Content-Type: application/json' \
      -d '{
            "data": {
              "title": "AI 技术发展报告",
              "subtitle": "2024-2025 年度分析",
              "slides": [
                {
                  "title": "大语言模型",
                  "bullets": ["技术突破", "应用场景", "未来趋势"]
                },
                {
                  "title": "多模态 AI",
                  "bullets": ["视觉理解", "语音识别", "跨模态学习"]
                },
                {
                  "title": "Agent 系统",
                  "bullets": ["自主规划", "工具使用", "协作能力"]
                }
              ]
            },
            "convertTo": "pptx"
          }' \
      --output /tmp/test-presentation.pptx
    
    if [ -f "/tmp/test-presentation.pptx" ]; then
        SIZE=$(du -h /tmp/test-presentation.pptx | cut -f1)
        echo ""
        echo "✅ 测试 PPT 生成成功！"
        echo "📁 文件: /tmp/test-presentation.pptx"
        echo "📊 大小: $SIZE"
        echo ""
        echo "你可以打开这个文件查看效果："
        echo "open /tmp/test-presentation.pptx"
    else
        echo "❌ 测试渲染失败"
    fi
fi

