/**
 * Carbone PPT 生成工具
 * 使用 Carbone Cloud API 生成专业的 PowerPoint 演示文稿
 */

const CARBONE_API_KEY = process.env.CARBONE_API_KEY || 'eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMjgwNTA3MDU0OTEyNzYxNzQ5IiwiYXVkIjoiY2FyYm9uZSIsImV4cCI6MjQyNDM2MzcyNiwiZGF0YSI6eyJ0eXBlIjoicHJvZCJ9fQ.AXMe7WXAYhGjU_7e4WkzUt0kZh6JMkm1LCisatVC8JUYsuYXG9rnf25JQ0VPSdxhPlcL13incPWhwmwD8Lukq5erAVT82zfx3B7IlsZWPlYFck70gnomK14NDHfUjzThydanBP5AhQ6mTLA7XiFmPwndJMoOhedIQmkf3IHLUHoO_gLg';
const CARBONE_TEMPLATE_ID = process.env.CARBONE_PPT_TEMPLATE_ID || 'c8d8f73e74ed42cd55f31ed9a4a74ce3042b824faade8c97b35c438525373738';
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
    
    console.log(`🎨 使用 Carbone ODP 模板生成 PPT: ${filename}, 幻灯片数: ${slides.length}`);
    
    // 准备数据（兼容多种可能的占位符）
    const mainTitle = title || filename;
    const mainSubtitle = `共 ${slides.length} 页 | 生成时间：${new Date().toLocaleDateString('zh-CN')}`;
    
    const presentationData = {
      // 标题的多种可能字段名
      title: mainTitle,
      presentation_title: mainTitle,
      main_title: mainTitle,
      cover_title: mainTitle,
      
      // 副标题的多种可能字段名
      subtitle: mainSubtitle,
      presentation_subtitle: mainSubtitle,
      description: mainSubtitle,
      
      // 其他可能有用的字段
      author: 'Mindflow AI',
      date: new Date().toLocaleDateString('zh-CN'),
      
      // 幻灯片数据（包含所有页）
      slides: slides.map((slide, index) => ({
        number: index + 1,
        title: slide.title,
        content: slide.content,
        bullets: slide.content.split('\n')
          .filter(line => line.trim())
          .filter(line => !line.startsWith('#'))
          .map(line => line.replace(/^[\-\*]\s*/, '').trim())
          .filter(line => line.length > 0)
      })),
      
      // 为了兼容，也添加第一张幻灯片作为标题
      cover: {
        title: mainTitle,
        subtitle: mainSubtitle
      }
    };
    
    console.log(`📋 使用 ODP 模板 ID: ${CARBONE_TEMPLATE_ID.substring(0, 20)}...`);
    console.log(`📊 幻灯片数据:`, JSON.stringify(presentationData, null, 2));
    
    // 使用预先上传的 ODP 模板渲染为 PPTX（一步直下）
    console.log('🎨 渲染 ODP → PPTX...');
    
    const renderResponse = await axios.post(
      `${CARBONE_BASE_URL}/render/${CARBONE_TEMPLATE_ID}?download=true`,
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
    
    // 验证文件大小（太小可能有问题）
    if (buffer.length < 10000) {
      console.warn(`⚠️ 警告：生成的 PPT 文件很小 (${buffer.length} bytes)，可能不完整`);
    }
    
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
        console.error('响应状态:', error.response?.status);
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

