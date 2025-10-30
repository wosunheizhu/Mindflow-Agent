/**
 * OCR 文字识别工具
 * 使用 Tesseract.js 识别图片和 PDF 中的文字
 */

// 动态导入以避免Vercel构建错误
let createWorker: any = null;
if (!process.env.VERCEL) {
  try {
    const tesseract = require('tesseract.js');
    createWorker = tesseract.createWorker;
  } catch (e) {
    console.warn('Tesseract.js未安装或不可用');
  }
}
import { readFile } from 'fs/promises';

/**
 * 识别图片中的文字
 */
export async function recognizeText(imagePath: string, lang: string = 'chi_sim+eng'): Promise<any> {
  // Vercel环境禁用OCR功能
  if (process.env.VERCEL) {
    throw new Error('OCR识别功能在生产环境不可用，请在本地环境使用或使用在线OCR服务');
  }
  
  if (!createWorker) {
    throw new Error('Tesseract.js未安装');
  }
  
  try {
    const worker = await createWorker(lang);
    
    const { data: { text, confidence } } = await worker.recognize(imagePath);
    
    await worker.terminate();

    return {
      text: text,
      confidence: confidence,
      language: lang,
      note: `✅ OCR 识别完成（置信度: ${confidence.toFixed(2)}%）`,
    };
  } catch (error: any) {
    throw new Error(`OCR 识别失败: ${error.message}`);
  }
}

/**
 * 从 PDF 扫描版提取文字（使用 OCR）
 */
export async function extractTextFromScannedPDF(pdfPath: string): Promise<any> {
  try {
    // 注意：完整实现需要将 PDF 转换为图片
    // 这里提供简化版本，实际应使用 pdf-poppler 等工具
    
    return {
      note: "PDF OCR 需要额外的图片转换步骤",
      suggestion: "建议先将 PDF 页面导出为图片，然后使用图片 OCR",
      text: "",
    };
  } catch (error: any) {
    throw new Error(`PDF OCR 失败: ${error.message}`);
  }
}




