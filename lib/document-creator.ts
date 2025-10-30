/**
 * 文档创建工具
 * 支持创建 Markdown, Word, PDF, Excel, TXT 等格式
 */

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

/**
 * 创建 Markdown 文档
 */
export async function createMarkdown(filename: string, content: string, frontmatter?: any): Promise<string> {
  try {
    // Vercel环境使用/tmp目录（唯一可写目录）
    const outputDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'outputs');
    if (!existsSync(outputDir) && !process.env.VERCEL) {
      await mkdir(outputDir, { recursive: true });
    }

    let markdown = '';

    // 添加 frontmatter（如果有）
    if (frontmatter) {
      markdown += '---\n';
      Object.entries(frontmatter).forEach(([key, value]) => {
        markdown += `${key}: ${value}\n`;
      });
      markdown += '---\n\n';
    }

    markdown += content;

    const filepath = path.join(outputDir, filename.endsWith('.md') ? filename : `${filename}.md`);
    await writeFile(filepath, markdown, 'utf-8');

    return filepath;
  } catch (error: any) {
    throw new Error(`Markdown 创建失败: ${error.message}`);
  }
}

/**
 * 创建 Word 文档
 */
export async function createWord(filename: string, content: string, options?: any): Promise<string> {
  // Word文档创建功能已完全禁用（officegen包已移除）
  throw new Error('Word文档创建功能已禁用，请使用Markdown格式替代（功能更强大）');
}

/**
 * 创建文本文件
 */
export async function createTextFile(filename: string, content: string): Promise<string> {
  try {
    // Vercel环境使用/tmp目录
    const outputDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'outputs');
    if (!existsSync(outputDir) && !process.env.VERCEL) {
      await mkdir(outputDir, { recursive: true });
    }

    const filepath = path.join(outputDir, filename.endsWith('.txt') ? filename : `${filename}.txt`);
    await writeFile(filepath, content, 'utf-8');

    return filepath;
  } catch (error: any) {
    throw new Error(`文本文件创建失败: ${error.message}`);
  }
}

/**
 * 创建 Excel 文件
 */
export async function createExcel(filename: string, data: any[][], sheetName: string = 'Sheet1'): Promise<string> {
  try {
    const XLSX = require('xlsx');
    const path = require('path');
    const fs = require('fs');

    // Vercel环境使用/tmp目录
    const outputDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir) && !process.env.VERCEL) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const filepath = path.join(outputDir, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
    
    // 写入文件
    XLSX.writeFile(wb, filepath);

    return filepath;
  } catch (error: any) {
    throw new Error(`Excel 文件创建失败: ${error.message}`);
  }
}

/**
 * 创建 JSON 文件
 */
export async function createJSON(filename: string, data: any): Promise<string> {
  try {
    // Vercel环境使用/tmp目录
    const outputDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'outputs');
    if (!existsSync(outputDir) && !process.env.VERCEL) {
      await mkdir(outputDir, { recursive: true });
    }

    const filepath = path.join(outputDir, filename.endsWith('.json') ? filename : `${filename}.json`);
    await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

    return filepath;
  } catch (error: any) {
    throw new Error(`JSON 文件创建失败: ${error.message}`);
  }
}

