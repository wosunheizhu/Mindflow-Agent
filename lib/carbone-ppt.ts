/**
 * Carbone PPT 生成工具
 * 使用 Carbone Cloud API 生成专业的 PowerPoint 演示文稿
 */

const CARBONE_API_KEY = process.env.CARBONE_API_KEY || 'eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMjgwNTA3MDU0OTEyNzYxNzQ5IiwiYXVkIjoiY2FyYm9uZSIsImV4cCI6MjQyNDM2MzcyNiwiZGF0YSI6eyJ0eXBlIjoicHJvZCJ9fQ.AXMe7WXAYhGjU_7e4WkzUt0kZh6JMkm1LCisatVC8JUYsuYXG9rnf25JQ0VPSdxhPlcL13incPWhwmwD8Lukq5erAVT82zfx3B7IlsZWPlYFck70gnomK14NDHfUjzThydanBP5AhQ6mTLA7XiFmPwndJMoOhedIQmkf3IHLUHoO_gLg';
const CARBONE_TEMPLATE_ID = process.env.CARBONE_PPT_TEMPLATE_ID || '35f9714f419f7a26bc7e5c557b14f51c0262d394ef97d240bd4a736e2492e0a4';
const CARBONE_BASE_URL = 'https://api.carbone.io';
const CARBONE_VERSION = '4';

/**
 * 创建基础 ODP 模板（用于动态生成）
 * 返回模板的 Buffer
 */
async function createBasicODPTemplate(): Promise<Buffer> {
  // 创建一个最基础的 ODP 模板内容（XML 格式）
  // 为简化，这里使用预定义的模板或直接调用 Carbone 的默认模板
  
  // 临时方案：使用一个简单的文本内容，Carbone 会处理
  const templateContent = `<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0">
  <office:body>
    <office:presentation>
      <draw:page>
        <draw:frame>
          <draw:text-box>
            <text:p>{d.title}</text:p>
          </draw:text-box>
        </draw:frame>
      </draw:page>
    </office:presentation>
  </office:body>
</office:document>`;
  
  return Buffer.from(templateContent, 'utf-8');
}

/**
 * 使用 Carbone 生成 PPT（动态模板方案）
 */
export async function generatePPTWithCarbone(
  filename: string,
  slides: Array<{ title: string; content: string }>,
  title?: string
): Promise<{ buffer: Buffer; filename: string }> {
  try {
    const axios = require('axios');
    const FormData = require('form-data');
    
    console.log(`🎨 使用 Carbone 生成 PPT: ${filename}, 幻灯片数: ${slides.length}`);
    console.log(`⚠️ Carbone 模板暂不可用，降级使用 HTML → PPTX 方案`);
    
    // 方案：创建富文本 HTML，Carbone 可以转换为 PPTX
    let htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>{d.title}</title>
  <style>
    .slide { page-break-after: always; padding: 40px; min-height: 500px; }
    h1 { color: #1e3a8a; font-size: 32px; margin-bottom: 20px; }
    h2 { color: #2563eb; font-size: 24px; margin: 30px 0 15px 0; }
    .subtitle { color: #6b7280; font-size: 18px; margin-bottom: 40px; }
    ul { margin: 20px 0; padding-left: 30px; }
    li { margin: 10px 0; font-size: 16px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="slide">
    <h1>{d.title}</h1>
    <div class="subtitle">{d.subtitle}</div>
  </div>
  
  <div class="slide">
    <h2>{d.slides[i].title}</h2>
    <ul>
      <li>{d.slides[i].bullets[j]}</li>
    </ul>
  </div>
</body>
</html>`;
    
    // 准备数据
    const presentationData = {
      title: title || filename,
      subtitle: `共 ${slides.length} 页 | 生成时间：${new Date().toLocaleDateString('zh-CN')}`,
      slides: slides.map((slide, index) => ({
        number: index + 1,
        title: slide.title,
        bullets: slide.content.split('\n')
          .filter(line => line.trim())
          .filter(line => !line.startsWith('#'))
          .map(line => line.replace(/^[\-\*]\s*/, '').trim())
          .filter(line => line.length > 0)
      }))
    };
    
    console.log(`📋 幻灯片数据准备完成`);
    
    // 1. 上传 HTML 模板
    const formData = new FormData();
    formData.append('template', Buffer.from(htmlTemplate, 'utf-8'), {
      filename: 'template.html',
      contentType: 'text/html'
    });
    
    console.log('📤 上传 HTML 模板到 Carbone...');
    
    const uploadResponse = await axios.post(
      `${CARBONE_BASE_URL}/template`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${CARBONE_API_KEY}`,
          'carbone-version': CARBONE_VERSION,
          ...formData.getHeaders()
        },
        timeout: 30000
      }
    );
    
    const templateId = uploadResponse.data.data.templateId;
    console.log(`✅ HTML 模板上传成功，ID: ${templateId.substring(0, 20)}...`);
    
    // 2. 渲染为 PPTX
    console.log('🎨 渲染 HTML → PPTX...');
    
    const renderResponse = await axios.post(
      `${CARBONE_BASE_URL}/render/${templateId}?download=true`,
      {
        data: presentationData,
        convertTo: 'pptx'
      },
      {
        headers: {
          'Authorization': `Bearer ${CARBONE_API_KEY}`,
          'carbone-version': CARBONE_VERSION,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    );
    
    const pptxFilename = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
    const buffer = Buffer.from(renderResponse.data);
    
    console.log(`✅ Carbone PPT 生成成功: ${pptxFilename}, 大小: ${(buffer.length / 1024).toFixed(2)} KB`);
    
    return {
      buffer,
      filename: pptxFilename
    };
    
  } catch (error: any) {
    console.error('❌ Carbone PPT 生成失败:', error.message);
    if (error.response?.data) {
      try {
        const errorText = Buffer.from(error.response.data).toString('utf-8');
        console.error('Carbone 错误详情:', errorText);
      } catch (e) {
        console.error('响应数据:', error.response.data);
      }
    }
    throw new Error(`Carbone PPT 生成失败: ${error.message}`);
  }
}

/**
 * 简化版：直接使用 Carbone API 渲染预定义模板
 */
export async function renderCarboneTemplate(
  templateId: string,
  data: any,
  convertTo: 'pptx' | 'pdf' | 'docx' = 'pptx'
): Promise<Buffer> {
  try {
    const axios = require('axios');
    
    const headers = {
      'Authorization': `Bearer ${CARBONE_API_KEY}`,
      'carbone-version': CARBONE_VERSION,
      'Content-Type': 'application/json'
    };
    
    // 一步直下：渲染并直接获取文件
    const response = await axios.post(
      `${CARBONE_BASE_URL}/render/${templateId}?download=true`,
      {
        data: data,
        convertTo: convertTo
      },
      {
        headers,
        responseType: 'arraybuffer',
        timeout: 60000
      }
    );
    
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error('❌ Carbone 渲染失败:', error.message);
    throw new Error(`Carbone 渲染失败: ${error.message}`);
  }
}

