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
 * 创建 Word 文档（使用 docx.js，支持 Vercel 环境）
 */
export async function createWord(filename: string, content: string, options?: any): Promise<string> {
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
    
    const docxFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;
    
    // 解析 Markdown 内容为段落
    const lines = content.split('\n');
    const children: any[] = [];
    
    for (const line of lines) {
      if (!line.trim()) {
        // 空行
        children.push(new Paragraph({ text: '' }));
      } else if (line.startsWith('# ')) {
        // H1 标题
        children.push(new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
        }));
      } else if (line.startsWith('## ')) {
        // H2 标题
        children.push(new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
        }));
      } else if (line.startsWith('### ')) {
        // H3 标题
        children.push(new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
        }));
      } else if (line.startsWith('- ')) {
        // 列表项
        children.push(new Paragraph({
          text: line.substring(2),
          bullet: { level: 0 },
        }));
      } else {
        // 普通段落（处理粗体和斜体）
        const textRuns: any[] = [];
        let currentText = line;
        
        // 简单处理粗体 **text**
        const boldRegex = /\*\*(.*?)\*\*/g;
        let lastIndex = 0;
        let match;
        
        while ((match = boldRegex.exec(currentText)) !== null) {
          if (match.index > lastIndex) {
            textRuns.push(new TextRun(currentText.substring(lastIndex, match.index)));
          }
          textRuns.push(new TextRun({ text: match[1], bold: true }));
          lastIndex = match.index + match[0].length;
        }
        
        if (lastIndex < currentText.length) {
          textRuns.push(new TextRun(currentText.substring(lastIndex)));
        }
        
        children.push(new Paragraph({ children: textRuns.length > 0 ? textRuns : [new TextRun(line)] }));
      }
    }
    
    // 创建文档
    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });
    
    // 生成 Buffer
    const buffer = await Packer.toBuffer(doc);
    
    // 保存文件
    const outputDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'outputs');
    if (!existsSync(outputDir) && !process.env.VERCEL) {
      await mkdir(outputDir, { recursive: true });
    }
    
    const filepath = path.join(outputDir, docxFilename);
    await writeFile(filepath, buffer);
    
    console.log(`✅ Word 文档创建成功: ${docxFilename}, 大小: ${(buffer.length / 1024).toFixed(2)} KB`);
    return filepath;
  } catch (error: any) {
    console.error('❌ Word 文档创建失败:', error.message);
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
 * 创建 PDF 文档（临时降级为 HTML，可在浏览器中打印为 PDF）
 */
export async function createPDF(filename: string, content: string): Promise<string> {
  try {
    console.log('⚠️ PDF 生成暂时降级为 HTML 格式（可在浏览器中打印为 PDF）');
    
    // 临时方案：生成可打印的 HTML 文件，用户可以在浏览器中 Ctrl+P 打印为 PDF
    // Puppeteer 在 Vercel 上配置复杂且容易超时，使用这个简单方案
    
    // 将 .pdf 改为 .html
    const htmlFilename = filename.replace(/\.pdf$/i, '.html');
    
    // 生成可打印的 HTML
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${htmlFilename}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body { 
      font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; 
      margin: 40px; 
      line-height: 1.8; 
      color: #333;
    }
    .no-print {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    h1 { 
      color: #1e3a8a; 
      border-bottom: 3px solid #3b82f6; 
      padding-bottom: 12px; 
      margin-top: 40px;
      font-size: 28px;
    }
    h2 { 
      color: #2563eb; 
      margin-top: 32px; 
      margin-bottom: 16px;
      font-size: 22px;
    }
    h3 { 
      color: #3b82f6; 
      margin-top: 24px;
      margin-bottom: 12px;
      font-size: 18px;
    }
    p { 
      margin: 12px 0; 
      text-align: justify;
    }
    ul { 
      margin: 12px 0; 
      padding-left: 24px; 
    }
    li {
      margin: 6px 0;
    }
    strong { 
      color: #1e40af; 
      font-weight: 600;
    }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()">🖨️ 打印为 PDF</button>
${content
  .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
  .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
  .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.*?)\*/g, '<em>$1</em>')
  .replace(/^\- (.*?)$/gm, '<li>$1</li>')
  .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
  .replace(/\n\n/g, '</p><p>')
  .replace(/^(?!<[h|l|u])/gm, '<p>')
  .replace(/<p><\/p>/g, '')}
</body>
</html>`;
    
    // 保存为 HTML 文件
    const outputDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'outputs');
    if (!existsSync(outputDir) && !process.env.VERCEL) {
      await mkdir(outputDir, { recursive: true });
    }
    
    const filepath = path.join(outputDir, htmlFilename);
    await writeFile(filepath, htmlContent, 'utf-8');
    
    console.log(`✅ 可打印 HTML 文档创建成功: ${htmlFilename}（可在浏览器中打印为 PDF）`);
    return filepath;
  } catch (error: any) {
    console.error('❌ PDF 文档创建失败:', error.message);
    throw new Error(`PDF 文档创建失败: ${error.message}`);
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

