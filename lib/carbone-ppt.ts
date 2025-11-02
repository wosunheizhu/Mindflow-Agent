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
    
    // 准备数据
    const presentationData = {
      title: title || filename,
      subtitle: `共 ${slides.length} 页`,
      slides: slides.map((slide, index) => ({
        number: index + 1,
        title: slide.title,
        content: slide.content,
        bullets: slide.content.split('\n')
          .filter(line => line.trim())
          .filter(line => !line.startsWith('#'))
          .map(line => line.replace(/^[\-\*]\s*/, '').trim())
      }))
    };
    
    // 使用预先上传的模板 ID
    const templateId = CARBONE_TEMPLATE_ID;
    console.log(`📋 使用 Carbone 模板 ID: ${templateId.substring(0, 20)}...`);
    
    // 渲染为 PPTX（一步直下）
    console.log('🎨 渲染 PPT...');
    
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
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
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

