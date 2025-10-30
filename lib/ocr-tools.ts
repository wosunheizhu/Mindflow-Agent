/**
 * OCR 文字识别工具
 * 使用 Tesseract.js 识别图片和 PDF 中的文字
 * 注意：在 Vercel 等无服务器环境中不可用
 */

// 条件导入 tesseract.js，在构建时如果不存在则使用 mock
let createWorker: any;
try {
  if (typeof window === 'undefined') {
    const tesseract = require('tesseract.js');
    createWorker = tesseract.createWorker;
  }
} catch (e) {
  // Tesseract.js 不可用（如 Vercel 环境）
  createWorker = null;
}

/**
 * 识别图片中的文字
 */
export async function recognizeText(imagePath: string, lang: string = 'chi_sim+eng'): Promise<any> {
  // 检查 tesseract.js 是否可用
  if (!createWorker) {
    return {
      success: false,
      error: 'OCR 功能在当前环境中不可用（需要本地部署或支持 Tesseract.js 的环境）',
      message: '请在本地环境或 Railway 等平台使用此功能',
      text: '',
      confidence: 0
    };
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




