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
  try {
    // Vercel环境暂不支持Word创建（officegen依赖问题）
    if (process.env.VERCEL) {
      throw new Error('Word文档创建功能暂不支持生产环境，请使用Markdown格式');
    }
    
    const officegen = require('officegen');
    const fs = require('fs');
    const path = require('path');

    // Vercel环境使用/tmp目录
    const outputDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir) && !process.env.VERCEL) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const docx = officegen('docx');

    // 添加标题
    if (options?.title) {
      const titleParagraph = docx.createP();
      titleParagraph.addText(options.title, { 
        bold: true, 
        font_size: 18,
        font_face: 'Arial'
      });
      titleParagraph.addLineBreak();
    }

    // 处理 Markdown 格式的内容
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const p = docx.createP();
        
        // 处理标题
        if (line.startsWith('# ')) {
          p.addText(line.substring(2), { bold: true, font_size: 16 });
        } else if (line.startsWith('## ')) {
          p.addText(line.substring(3), { bold: true, font_size: 14 });
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          p.addText('• ' + line.substring(2));
        } else {
          p.addText(line);
        }
      } else {
        // 空行
        docx.createP();
      }
    }

    const filepath = path.join(outputDir, filename.endsWith('.docx') ? filename : `${filename}.docx`);

    return new Promise((resolve, reject) => {
      const out = fs.createWriteStream(filepath);
      
      out.on('error', (err: any) => {
        reject(new Error(`Word 文档创建失败: ${err.message}`));
      });

      out.on('finish', () => {
        // 等待文件完全写入
        setTimeout(() => {
          if (fs.existsSync(filepath)) {
            resolve(filepath);
          } else {
            reject(new Error('文件创建后未找到'));
          }
        }, 100);
      });

      docx.on('finalize', () => {
        // finalize 事件触发但不立即 resolve
      });

      docx.on('error', (err: any) => {
        reject(new Error(`Word 文档生成错误: ${err.message}`));
      });

      docx.generate(out);
    });
  } catch (error: any) {
    throw new Error(`Word 文档创建失败: ${error.message}`);
  }
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

