/**
 * OCR 文字识别工具
 * 注意：Tesseract.js在Serverless环境不可用，功能已禁用
 * 生产环境建议使用在线OCR服务或GPT-4o Vision
 */

import { readFile } from 'fs/promises';

/**
 * 识别图片中的文字
 */
export async function recognizeText(imagePath: string, lang: string = 'chi_sim+eng'): Promise<any> {
  throw new Error('OCR识别功能在生产环境不可用。建议：1) 使用GPT-4o Vision分析图片 2) 使用在线OCR服务');
}

/**
 * 从 PDF 扫描版提取文字（使用 OCR）
 */
export async function extractTextFromScannedPDF(pdfPath: string): Promise<any> {
  throw new Error('PDF OCR功能在生产环境不可用。建议：1) 使用GPT-4o Vision 2) 使用在线OCR服务');
}
