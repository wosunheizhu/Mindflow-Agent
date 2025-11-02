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
 * 创建 Word 文档（使用 Aspose Cloud API）
 */
export async function createWord(filename: string, content: string, options?: any): Promise<string> {
  try {
    const axios = require('axios');
    const FormData = require('form-data');
    
    // 1. 获取 Aspose Access Token
    const clientId = process.env.ASPOSE_CLIENT_ID || '43287341-617f-4d95-9caa-b166d46fbb8d';
    const clientSecret = process.env.ASPOSE_CLIENT_SECRET || '1c0df04fbde71bcfbc75cbe6f3d297bf';
    
    const tokenResponse = await axios.post(
      'https://api.aspose.cloud/connect/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // 2. 将 Markdown 内容转换为简单的 HTML
    const htmlContent = content
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\- (.*?)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|l|p])/gm, '<p>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // 3. 使用 Aspose Words API 从 HTML 创建 Word 文档
    const docxFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;
    
    const response = await axios.post(
      `https://api.aspose.cloud/v4.0/words/convert?format=docx`,
      `<html><body>${htmlContent}</body></html>`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/html',
        },
        responseType: 'arraybuffer',
        timeout: 60000,
      }
    );
    
    // 4. 保存文件
    const outputDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'outputs');
    if (!existsSync(outputDir) && !process.env.VERCEL) {
      await mkdir(outputDir, { recursive: true });
    }
    
    const filepath = path.join(outputDir, docxFilename);
    await writeFile(filepath, Buffer.from(response.data));
    
    console.log(`✅ Word 文档创建成功: ${docxFilename}`);
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
 * 创建 PDF 文档（使用 Aspose Cloud API）
 */
export async function createPDF(filename: string, content: string): Promise<string> {
  try {
    const axios = require('axios');
    
    // 1. 获取 Aspose Access Token
    const clientId = process.env.ASPOSE_CLIENT_ID || '43287341-617f-4d95-9caa-b166d46fbb8d';
    const clientSecret = process.env.ASPOSE_CLIENT_SECRET || '1c0df04fbde71bcfbc75cbe6f3d297bf';
    
    const tokenResponse = await axios.post(
      'https://api.aspose.cloud/connect/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // 2. 将 Markdown 内容转换为 HTML
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #2563eb; margin-top: 30px; }
    h3 { color: #3b82f6; }
    p { margin: 10px 0; }
    ul { margin: 10px 0; padding-left: 20px; }
    strong { color: #1e40af; }
  </style>
</head>
<body>
${content
  .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
  .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
  .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.*?)\*/g, '<em>$1</em>')
  .replace(/^\- (.*?)$/gm, '<li>$1</li>')
  .replace(/\n\n/g, '</p><p>')
  .replace(/^(?!<)/gm, '<p>')
  .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')}
</body>
</html>`;
    
    // 3. 使用 Aspose HTML to PDF API
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    
    const response = await axios.post(
      'https://api.aspose.cloud/v4.0/html/convert/pdf',
      htmlContent,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/html',
        },
        responseType: 'arraybuffer',
        timeout: 60000,
      }
    );
    
    // 4. 保存文件
    const outputDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'outputs');
    if (!existsSync(outputDir) && !process.env.VERCEL) {
      await mkdir(outputDir, { recursive: true });
    }
    
    const filepath = path.join(outputDir, pdfFilename);
    await writeFile(filepath, Buffer.from(response.data));
    
    console.log(`✅ PDF 文档创建成功: ${pdfFilename}`);
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

