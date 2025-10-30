/**
 * OCR 文字识别工具
 * 使用 Tesseract.js 识别图片和 PDF 中的文字
 */

import { readFile } from 'fs/promises';

// 条件导入tesseract，避免Vercel环境加载
const getTesseract = async () => {
  if (process.env.VERCEL) {
    throw new Error('OCR识别功能在Vercel生产环境不可用（Serverless限制）。建议使用GPT-4o Vision分析图片');
  }
  const tesseract = await import('tesseract.js');
  return tesseract;
};

/**
 * 识别图片中的文字
 */
export async function recognizeText(imagePath: string, lang: string = 'chi_sim+eng'): Promise<any> {
  const tesseract = await getTesseract();
  const worker = await tesseract.createWorker(lang);
  
  try {
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
    // 注意：完整实现需要将 PDF 转换为图片
    return {
      note: "PDF OCR 需要额外的图片转换步骤",
      suggestion: "建议先将 PDF 页面导出为图片，然后使用图片 OCR",
      text: "",
    };
}
