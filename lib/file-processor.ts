/**
 * 文件处理工具
 * 支持 PDF, Word, Excel 等文档解析
 */

import { readFile } from "fs/promises";
import path from "path";

/**
 * 解析 PDF 文件
 */
export async function parsePDF(filepath: string): Promise<string> {
  try {
    // pdf-parse 作为默认导出
    const pdfParse = require('pdf-parse');
    const dataBuffer = await readFile(filepath);
    
    // 直接调用（pdf-parse 是一个异步函数）
    const data = await pdfParse(dataBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      return "PDF 解析成功，但未提取到文本内容。这可能是扫描版 PDF（纯图片）。";
    }
    
    console.log(`PDF 解析成功: ${filepath}, 文本长度: ${data.text.length}`);
    return data.text;
  } catch (error: any) {
    console.error('PDF 解析错误:', error);
    throw new Error(`PDF 解析失败: ${error.message}`);
  }
}

/**
 * 解析 Word 文档
 */
export async function parseWord(filepath: string): Promise<string> {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filepath });
    return result.value;
  } catch (error: any) {
    throw new Error(`Word 文档解析失败: ${error.message}`);
  }
}

/**
 * 解析 Excel 文件
 */
export async function parseExcel(filepath: string): Promise<any> {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filepath);
    
    const result: any = {};
    
    workbook.SheetNames.forEach((sheetName: string) => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      result[sheetName] = data;
    });
    
    return result;
  } catch (error: any) {
    throw new Error(`Excel 解析失败: ${error.message}`);
  }
}

/**
 * 根据文件类型自动解析
 */
export async function parseFile(filepath: string, fileType: string): Promise<any> {
  const ext = path.extname(filepath).toLowerCase();
  
  try {
    if (ext === '.pdf' || fileType.includes('pdf')) {
      return { type: 'text', content: await parsePDF(filepath) };
    } else if (ext === '.docx' || ext === '.doc' || fileType.includes('word')) {
      return { type: 'text', content: await parseWord(filepath) };
    } else if (ext === '.xlsx' || ext === '.xls' || fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return { type: 'data', content: await parseExcel(filepath) };
    } else if (ext === '.txt') {
      return { type: 'text', content: await readFile(filepath, 'utf-8') };
    } else {
      throw new Error(`不支持的文件类型: ${ext}`);
    }
  } catch (error: any) {
    throw error;
  }
}

/**
 * 文本分块（用于向量化）
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  
  return chunks;
}

/**
 * 简单的文本搜索（不使用向量数据库）
 */
export function searchInText(text: string, query: string): any[] {
  const chunks = chunkText(text, 500, 100);
  const results: any[] = [];
  
  const queryLower = query.toLowerCase();
  
  chunks.forEach((chunk, index) => {
    if (chunk.toLowerCase().includes(queryLower)) {
      results.push({
        chunkIndex: index,
        snippet: chunk.substring(0, 200) + '...',
        relevance: chunk.toLowerCase().split(queryLower).length - 1,
      });
    }
  });
  
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
}

