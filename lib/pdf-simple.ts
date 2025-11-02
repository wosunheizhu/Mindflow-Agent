/**
 * 简化的 PDF 生成方案
 * 使用外部 API 服务，避免 Puppeteer 在 Vercel 上的复杂配置
 */

/**
 * 使用 HTML-PDF API 生成 PDF（简单可靠）
 */
export async function generatePDFSimple(htmlContent: string): Promise<Buffer> {
  try {
    // 方案1：使用 html-pdf-node（纯 Node.js，无浏览器依赖）
    const htmlPdf = require('html-pdf-node');
    
    const options = { 
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    };
    
    const file = { content: htmlContent };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    return pdfBuffer;
  } catch (error: any) {
    console.error('❌ PDF 生成失败（html-pdf-node）:', error.message);
    
    // 方案2：降级到外部 API 服务
    throw new Error('PDF 生成暂不可用，请使用 Word 或 Markdown 格式');
  }
}

/**
 * Markdown 转 HTML（带样式）
 */
export function markdownToHTML(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; 
      margin: 40px; 
      line-height: 1.8; 
      color: #333;
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
}

