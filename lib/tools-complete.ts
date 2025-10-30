/**
 * 完整工具集 - 包含所有高级功能
 * 文件处理 + 浏览器自动化 + 所有基础工具
 */

import { parseFile, searchInText } from "./file-processor";
import { visitWebsite, automateWebsite, extractWebData } from "./browser-automation";
import { analyzeImage, compareImages } from "./image-analyzer";
import { createMarkdown, createWord, createTextFile, createExcel, createJSON } from "./document-creator";
import { registerDownload } from "./download-registry";
import { listDirectory, createDirectory, deleteFile, moveFile, copyFileOp, renameFile, getFileInfo } from "./file-operations";
import { callAPI, translateText, dateTimeOperation, processText, convertData } from "./advanced-tools";
import { createBarChart, createLineChart, createPieChart } from "./visualization-tools";
import { recognizeText } from "./ocr-tools";
import { sendEmail, sendEmailWithAttachment } from "./email-tools";
import { 
  setWorkspace, 
  scanWorkspace, 
  readFileInWorkspace, 
  writeFileInWorkspace, 
  createFolderInWorkspace, 
  deleteFileInWorkspace, 
  searchInWorkspace,
  getWorkspaceInfo,
  getCurrentWorkspace 
} from "./workspace-manager";
import { workflowManager } from "./workflow-manager";
import { WorkflowEngine } from "./workflow-engine";
import { planWorkflow, validateWorkflow } from "./workflow-planner";

const resolveBaseUrl = (): string => {
  const normalize = (url?: string | null): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return withProtocol.replace(/\/$/, "");
  };

  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null,
    process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null,
    process.env.RAILWAY_URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalize(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return normalize(process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://localhost:3000")!;
};

// 文件存储（简单版本，生产环境应使用数据库）
const uploadedFiles: Map<string, any> = new Map();

// 定义可用的工具
export const tools = [
  {
    type: "function",
    function: {
      name: "search_web",
      description: "搜索互联网获取实时信息。用于查找最新新闻、事件、数据等。",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "搜索查询关键词",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "execute_code",
      description: "执行 Python 或 JavaScript 代码并返回结果。可用于数据分析、计算等。",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "要执行的代码",
          },
          language: {
            type: "string",
            enum: ["python", "javascript"],
            description: "编程语言",
          },
        },
        required: ["code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "根据文字描述生成图像",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "图像描述提示词",
          },
          size: {
            type: "string",
            enum: ["1024x1024", "1792x1024", "1024x1792"],
            description: "图像尺寸",
          },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "读取和分析上传的文档内容（PDF, Word, Excel, TXT）",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "已上传的文件名",
          },
          query: {
            type: "string",
            description: "（可选）在文件中搜索的关键词",
          },
        },
        required: ["filename"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "visit_website",
      description: "访问网页，获取内容并截图。用于查看网页内容、验证网站状态等。",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "要访问的网址（必须是完整 URL，如 https://example.com）",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "extract_web_data",
      description: "从网页中提取特定数据。用于数据采集、内容抓取等。",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "要访问的网址",
          },
          selectors: {
            type: "array",
            items: {
              type: "string",
            },
            description: "CSS 选择器数组，用于定位要提取的元素",
          },
        },
        required: ["url", "selectors"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "执行数学计算",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "数学表达式，例如：2 + 2, sqrt(16), sin(45)",
          },
        },
        required: ["expression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_image",
      description: "分析上传的图片内容。可以识别图片中的物体、场景、文字、情感等。",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "已上传的图片文件名",
          },
          question: {
            type: "string",
            description: "（可选）关于图片的具体问题",
          },
        },
        required: ["filename"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_presentation",
      description: "创建 PowerPoint 演示文稿（PPT）。可以添加多张幻灯片，每张幻灯片包含标题和内容。",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "演示文稿文件名（不含扩展名），如 'product_report'",
          },
          title: {
            type: "string",
            description: "演示文稿总标题",
          },
          slides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "幻灯片标题",
                },
                content: {
                  type: "string",
                  description: "幻灯片内容（支持多行文本，用\\n分隔）",
                },
              },
            },
            description: "幻灯片数组，每个对象包含 title 和 content",
          },
        },
        required: ["filename", "slides"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "convert_document",
      description: "转换文档格式（Word、Excel、PDF、PPT 等互转）。支持 DOCX→PDF、XLSX→PDF、PPTX→PDF、HTML→PDF 等。",
      parameters: {
        type: "object",
        properties: {
          input_file: {
            type: "string",
            description: "输入文件名（在 uploads 目录中）",
          },
          output_format: {
            type: "string",
            enum: ["pdf", "docx", "xlsx", "pptx", "html", "txt", "png", "jpg"],
            description: "目标格式",
          },
          output_filename: {
            type: "string",
            description: "输出文件名（不含扩展名），可选",
          },
        },
        required: ["input_file", "output_format"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "extract_pdf_text",
      description: "从 PDF 文件中提取文本内容。可以提取全部或指定页码的文本。",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "PDF 文件名（在 uploads 目录中）",
          },
          page_number: {
            type: "number",
            description: "页码（可选，不指定则提取全部）",
          },
        },
        required: ["filename"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ocr_image",
      description: "识别图片中的文字（OCR）。支持中英文混合识别，可以处理扫描件、截图、照片等。",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "图片文件名（在 uploads 目录中）",
          },
          language: {
            type: "string",
            enum: ["auto", "chinese", "english"],
            description: "识别语言，默认 auto 自动检测",
          },
        },
        required: ["filename"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_qrcode",
      description: "生成二维码图片。可以将文本、链接等编码为二维码。",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "要编码的文本或 URL",
          },
          filename: {
            type: "string",
            description: "输出文件名（不含扩展名）",
          },
          size: {
            type: "number",
            description: "图片大小（像素），默认 300",
          },
        },
        required: ["text", "filename"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_document",
      description: "创建文档文件（Markdown、Word、Excel、TXT、JSON）。用于保存分析结果、生成报告等。",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "文件名（含扩展名，如 report.md, document.docx, data.xlsx）",
          },
          content: {
            type: "string",
            description: "文档内容（文本内容或 JSON 字符串）",
          },
          format: {
            type: "string",
            enum: ["markdown", "word", "text", "excel", "json"],
            description: "文档格式",
          },
          options: {
            type: "object",
            description: "可选配置（如 Word 标题、Excel 表名等）",
          },
        },
        required: ["filename", "content", "format"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "file_operations",
      description: "文件系统操作（列出目录、创建文件夹、删除文件、移动文件、复制文件、重命名等）",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["list", "create_dir", "delete", "move", "copy", "rename", "info"],
            description: "操作类型",
          },
          path: {
            type: "string",
            description: "文件或文件夹路径",
          },
          new_path: {
            type: "string",
            description: "新路径（用于移动、复制、重命名）",
          },
        },
        required: ["operation"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_and_execute_workflow",
      description: "根据复杂任务自动创建并执行工作流。用于需要多个步骤、多个工具协作完成的复杂任务。",
      parameters: {
        type: "object",
        properties: {
          task_description: {
            type: "string",
            description: "详细的任务描述，说明要完成什么",
          },
          auto_execute: {
            type: "boolean",
            description: "是否立即执行（默认 true）",
          },
        },
        required: ["task_description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "call_api",
      description: "调用任意 REST API 接口。可以调用第三方服务、获取数据、提交信息等。",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "API 端点 URL",
          },
          method: {
            type: "string",
            enum: ["GET", "POST", "PUT", "DELETE"],
            description: "HTTP 方法",
          },
          data: {
            type: "object",
            description: "请求数据（POST/PUT）",
          },
          headers: {
            type: "object",
            description: "请求头",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "translate_text",
      description: "翻译文本到其他语言。支持多语言互译。",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "要翻译的文本",
          },
          target_lang: {
            type: "string",
            description: "目标语言代码（zh=中文, en=英文, ja=日语, ko=韩语等）",
          },
          source_lang: {
            type: "string",
            description: "源语言代码（auto=自动检测）",
          },
        },
        required: ["text", "target_lang"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "datetime_tool",
      description: "日期时间处理工具。获取当前时间、格式化日期、计算日期差、日期加减等。",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["current", "format", "add_days", "diff", "parse"],
            description: "操作类型",
          },
          date_input: {
            type: "string",
            description: "输入日期（ISO格式或自然语言）",
          },
          format_or_value: {
            type: "string",
            description: "格式字符串或数值（如天数）",
          },
        },
        required: ["operation"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "process_text",
      description: "文本处理工具。统计字数、提取内容、替换文本、格式化等。",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["count", "extract", "replace", "format", "split"],
            description: "操作类型",
          },
          text: {
            type: "string",
            description: "要处理的文本",
          },
          params: {
            type: "object",
            description: "操作参数（如正则表达式、替换内容等）",
          },
        },
        required: ["operation", "text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "convert_data",
      description: "数据格式转换。支持 JSON、CSV 等格式互转。",
      parameters: {
        type: "object",
        properties: {
          data: {
            type: "string",
            description: "要转换的数据",
          },
          from_format: {
            type: "string",
            enum: ["json", "csv", "xml"],
            description: "源格式",
          },
          to_format: {
            type: "string",
            enum: ["json", "csv", "xml"],
            description: "目标格式",
          },
        },
        required: ["data", "from_format", "to_format"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_chart",
      description: "创建数据可视化图表（柱状图、折线图、饼图）。用于数据展示和报告。",
      parameters: {
        type: "object",
        properties: {
          chart_type: {
            type: "string",
            enum: ["bar", "line", "pie"],
            description: "图表类型",
          },
          labels: {
            type: "array",
            items: { type: "string" },
            description: "标签数组（X轴或分类）",
          },
          values: {
            type: "array",
            items: { type: "number" },
            description: "数值数组",
          },
          title: {
            type: "string",
            description: "图表标题",
          },
        },
        required: ["chart_type", "labels", "values"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ocr_recognize",
      description: "识别图片中的文字（OCR）。可识别照片、截图、扫描文档中的文字。",
      parameters: {
        type: "object",
        properties: {
          image_filename: {
            type: "string",
            description: "图片文件名",
          },
          language: {
            type: "string",
            description: "语言（chi_sim=简体中文, eng=英文, chi_sim+eng=中英文）",
          },
        },
        required: ["image_filename"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "发送电子邮件。可发送纯文本或带附件的邮件。",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "收件人邮箱地址",
          },
          subject: {
            type: "string",
            description: "邮件主题",
          },
          content: {
            type: "string",
            description: "邮件内容",
          },
          attachment_path: {
            type: "string",
            description: "附件路径（可选）",
          },
        },
        required: ["to", "subject", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "workspace_operation",
      description: "工作区操作（类似 Cursor）。设置工作文件夹后，可以在其中自由读写文件、创建文件夹、搜索文件等。",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["set", "scan", "read", "write", "create_folder", "delete", "search", "info"],
            description: "操作类型",
          },
          path: {
            type: "string",
            description: "文件或文件夹的相对路径",
          },
          content: {
            type: "string",
            description: "文件内容（write 操作时使用）",
          },
          query: {
            type: "string",
            description: "搜索关键词（search 操作时使用）",
          },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "获取指定城市的当前天气信息",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "城市名称，例如：北京、上海",
          },
        },
        required: ["location"],
      },
    },
  },
];

// 工具执行函数
export async function executeToolCall(toolName: string, args: any): Promise<any> {
  console.log(`执行工具: ${toolName}`, args);

  switch (toolName) {
    case "search_web":
      return await searchWeb(args.query);
    
    case "execute_code":
      return await executeCode(args.code, args.language || "python");
    
    case "generate_image":
      return await generateImage(args.prompt, args.size);
    
    case "read_file":
      return await readFileContent(args.filename, args.query);
    
    case "visit_website":
      return await visitWebsiteTool(args.url);
    
    case "extract_web_data":
      return await extractWebDataTool(args.url, args.selectors);
    
    case "analyze_image":
      return await analyzeImageTool(args.filename, args.question);
    
    case "create_presentation":
      if (!args.filename || !args.slides || !Array.isArray(args.slides)) {
        return {
          error: "参数错误",
          message: "必须提供 filename 和 slides 数组",
          example: {
            filename: "product_report",
            title: "产品分析报告",
            slides: [
              { title: "概述", content: "这是产品分析的概述..." },
              { title: "市场分析", content: "市场规模\n竞争对手\n..." }
            ]
          }
        };
      }
      return await createPresentation(args.filename, args.slides, args.title);
    
    case "convert_document":
      if (!args.input_file || !args.output_format) {
        return {
          error: "参数错误",
          message: "必须提供 input_file 和 output_format",
          example: {
            input_file: "report.docx",
            output_format: "pdf",
            output_filename: "report_converted"
          }
        };
      }
      return await convertDocument(args.input_file, args.output_format, args.output_filename);
    
    case "extract_pdf_text":
      if (!args.filename) {
        return { error: "参数错误", message: "必须提供 filename" };
      }
      return await extractPdfText(args.filename, args.page_number);
    
    case "ocr_image":
      if (!args.filename) {
        return { error: "参数错误", message: "必须提供 filename" };
      }
      return await ocrImage(args.filename, args.language || 'auto');
    
    case "generate_qrcode":
      if (!args.text || !args.filename) {
        return { error: "参数错误", message: "必须提供 text 和 filename" };
      }
      return await generateQRCode(args.text, args.filename, args.size || 300);
    
    case "create_document":
      if (!args.filename || !args.content || !args.format) {
        return {
          error: "参数错误",
          message: "必须提供 filename、content 和 format 参数",
          example: {
            filename: "report.md",
            content: "# 报告标题\n\n内容...",
            format: "markdown"
          }
        };
      }
      return await createDocumentTool(args.filename, args.content, args.format, args.options);
    
    case "file_operations":
      return await fileOperationsTool(args.operation, args.path, args.new_path);
    
    case "create_and_execute_workflow":
      return await createAndExecuteWorkflow(args.task_description, args.auto_execute !== false);
    
    case "call_api":
      return await callAPI(args.url, args.method, args.data, args.headers);
    
    case "translate_text":
      return await translateText(args.text, args.target_lang, args.source_lang);
    
    case "datetime_tool":
      return dateTimeOperation(args.operation, args.date_input, args.format_or_value);
    
    case "process_text":
      return processText(args.operation, args.text, args.params);
    
    case "convert_data":
      return convertData(args.data, args.from_format, args.to_format);
    
    case "create_chart":
      return await createChartTool(args.chart_type, args.labels, args.values, args.title);
    
    case "ocr_recognize":
      return await ocrRecognizeTool(args.image_filename, args.language);
    
    case "send_email":
      return await sendEmailTool(args.to, args.subject, args.content, args.attachment_path);
    
    case "workspace_operation":
      return await workspaceOperationTool(args.action, args.path, args.content, args.query);
    
    case "calculate":
      return await calculate(args.expression);
    
    case "get_current_weather":
      return await getCurrentWeather(args.location, args.unit);
    
    default:
      return { error: "未知的工具" };
  }
}

// 存储文件信息
export function storeFileInfo(filename: string, filepath: string, fileType: string) {
  console.log('存储文件信息:', filename, filepath, fileType);
  uploadedFiles.set(filename, { filepath, fileType, uploadedAt: new Date() });
}

// 获取所有文件
export function getAllFiles() {
  return Array.from(uploadedFiles.entries()).map(([name, info]) => ({
    name,
    ...info,
  }));
}

// 工具实现函数

/**
 * 网页搜索 - Brave Search API
 */
async function searchWeb(query: string) {
  // 优先尝试 Brave Search（如果配置了 API Key）
  if (process.env.BRAVE_API_KEY) {
    try {
      const axios = require('axios');
      
      // Brave Search 重试机制
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
            params: { q: query, count: 5 },
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip',
              'X-Subscription-Token': process.env.BRAVE_API_KEY,
            },
            timeout: 15000,
          });

          const data = response.data;

          if (!data.web?.results?.length) {
            return { results: [], note: "未找到相关结果", query };
          }

          const results = data.web.results.map((item: any) => ({
            title: item.title,
            snippet: item.description,
            url: item.url,
            source: 'Brave Search',
          }));

          return {
            results,
            query,
            totalResults: results.length,
            note: `✅ 使用 Brave Search API (尝试 ${attempt}/3)`,
            isSimulated: false,
          };
        } catch (err: any) {
          lastError = err;
          console.error(`Brave Search 尝试 ${attempt}/3 失败:`, err.message);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      // Brave Search 所有重试都失败，回退到 DuckDuckGo
      console.log('Brave Search 失败，自动切换到 DuckDuckGo 作为回退方案...');
      return await searchWithDuckDuckGo(query);
      
    } catch (error: any) {
      console.error('Brave Search 错误:', error.message);
      console.log('自动切换到 DuckDuckGo 作为回退方案...');
      return await searchWithDuckDuckGo(query);
    }
  } else {
    // 未配置 Brave API Key，直接使用 DuckDuckGo
    console.log('未配置 Brave API Key，使用 DuckDuckGo（免费，无需配置）');
    return await searchWithDuckDuckGo(query);
  }
}

/**
 * DuckDuckGo 搜索（回退方案）
 * 优点：完全免费，无需 API 密钥，零配置
 */
async function searchWithDuckDuckGo(query: string) {
  try {
    const axios = require('axios');
    
    const response = await axios.get('https://api.duckduckgo.com/', {
      params: {
        q: query,
        format: 'json',
        no_html: 1,
        skip_disambig: 1,
      },
      timeout: 10000,
    });

    const data = response.data;
    const results = [];

    // 主要答案
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        snippet: data.AbstractText,
        url: data.AbstractURL || '',
        source: 'DuckDuckGo',
      });
    }

    // 相关主题
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, 4).forEach((topic: any) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 50),
            snippet: topic.Text,
            url: topic.FirstURL,
            source: 'DuckDuckGo',
          });
        }
      });
    }

    // 如果没有结果
    if (results.length === 0) {
      return {
        results: [{
          title: `关于 "${query}" 的搜索`,
          snippet: "未找到详细信息。建议尝试更具体的查询词。",
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          source: 'DuckDuckGo',
        }],
        query: query,
        note: "💡 使用 DuckDuckGo 作为回退方案（免费）",
        isSimulated: false,
      };
    }

    return {
      results: results,
      query: query,
      totalResults: results.length,
      source: 'DuckDuckGo (回退方案)',
      note: "✅ 使用 DuckDuckGo 作为回退方案（免费，无需 API Key）",
      isSimulated: false,
    };
  } catch (error: any) {
    console.error('DuckDuckGo 搜索错误:', error.message);
    return {
      results: [{
        title: `搜索 "${query}"`,
        snippet: "所有搜索服务暂时不可用，请稍后重试",
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        source: 'Error',
      }],
      note: "⚠️ 搜索失败：Brave 和 DuckDuckGo 都不可用",
      error: error.message,
      isSimulated: true,
    };
  }
}

/**
 * 代码执行 - Piston API
 */
async function executeCode(code: string, language: string = "python") {
  try {
    const axios = require('axios');
    
    const languageMap: any = {
      python: { language: 'python', version: '3.10.0' },
      javascript: { language: 'javascript', version: '18.15.0' },
    };

    const langConfig = languageMap[language] || languageMap.python;

    const response = await axios.post(
      'https://emkc.org/api/v2/piston/execute',
      {
        language: langConfig.language,
        version: langConfig.version,
        files: [{ name: `main.${language === 'python' ? 'py' : 'js'}`, content: code }],
      },
      { timeout: 10000 }
    );

    const result = response.data;
    let output = result.run?.output || result.run?.stderr || '无输出';

    return {
      output: output.trim(),
      language,
      status: result.run?.code === 0 ? "Success" : "Error",
      note: "✅ 使用 Piston API",
      isSimulated: false,
    };
  } catch (error: any) {
    console.error('Piston API 错误:', error.message);
    return {
      output: `执行失败：${error.message}`,
      note: "⚠️ 代码执行失败",
      isSimulated: true,
    };
  }
}

/**
 * 图像生成 - DALL-E 3
 */
async function generateImage(prompt: string, size: string = "1024x1024") {
  try {
    const OpenAI = require("openai").default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: size as any,
    });

    return {
      image_url: response.data[0].url,
      prompt,
      size,
    };
  } catch (error: any) {
    return {
      error: "图像生成失败",
      message: error.message,
    };
  }
}

/**
 * 读取文件内容
 */
async function readFileContent(filename: string, query?: string) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // 从文件系统读取文件列表（更可靠，不依赖内存）
    const uploadsDir = path.join(process.cwd(), 'uploads');
    let actualFilepath = '';
    let actualFileType = '';
    
    // 检查 uploads 目录是否存在
    if (!fs.existsSync(uploadsDir)) {
      return {
        error: "上传目录不存在",
        message: "请先上传文件",
      };
    }
    
    // 读取目录中的所有文件
    const files = fs.readdirSync(uploadsDir);
    
    if (files.length === 0) {
      return {
        error: "没有已上传的文件",
        message: "请先上传文件",
      };
    }
    
    // 查找匹配的文件（支持模糊匹配）
    const matchedFile = files.find((file: string) => {
      return file === filename || 
             file.includes(filename) || 
             filename.includes(file) ||
             file.toLowerCase().includes(filename.toLowerCase());
    });
    
    if (!matchedFile) {
      return {
        error: "文件未找到",
        message: `文件 "${filename}" 不存在`,
        availableFiles: files,
        hint: `已上传的文件：${files.join(', ')}`,
      };
    }
    
    actualFilepath = path.join(uploadsDir, matchedFile);
    actualFileType = matchedFile.endsWith('.pdf') ? 'application/pdf' :
                     matchedFile.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                     matchedFile.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                     'text/plain';

    const parsed = await parseFile(actualFilepath, actualFileType);

    if (query && parsed.type === 'text') {
      // 在文件中搜索
      const results = searchInText(parsed.content, query);
      return {
        filename: matchedFile,
        type: parsed.type,
        searchResults: results,
        totalFound: results.length,
        note: "✅ 文件搜索完成",
      };
    } else {
      // 返回文件内容
      return {
        filename: matchedFile,
        type: parsed.type,
        content: parsed.type === 'text' 
          ? parsed.content.substring(0, 3000) + (parsed.content.length > 3000 ? '...' : '')
          : parsed.content,
        fullLength: parsed.type === 'text' ? parsed.content.length : null,
        note: "✅ 文件读取成功",
      };
    }
  } catch (error: any) {
    return {
      error: "文件处理失败",
      message: error.message,
    };
  }
}

/**
 * 访问网站工具
 */
async function visitWebsiteTool(url: string) {
  try {
    const result = await visitWebsite(url);
    return {
      ...result,
      note: "✅ 网页访问成功（包含截图）",
    };
  } catch (error: any) {
    return {
      error: "网页访问失败",
      message: error.message,
      url,
    };
  }
}

/**
 * 提取网页数据工具
 */
async function extractWebDataTool(url: string, selectors: string[]) {
  try {
    const result = await extractWebData(url, selectors);
    return {
      ...result,
      note: "✅ 数据提取成功",
    };
  } catch (error: any) {
    return {
      error: "数据提取失败",
      message: error.message,
      url,
    };
  }
}

/**
 * 图片分析工具
 */
async function analyzeImageTool(filename: string, question?: string) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // 从文件系统查找图片
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const files = fs.readdirSync(uploadsDir);
    
    const matchedFile = files.find((file: string) => {
      return file === filename || 
             file.includes(filename) || 
             filename.includes(file) ||
             file.toLowerCase().includes(filename.toLowerCase());
    });
    
    if (!matchedFile) {
      return {
        error: "图片未找到",
        message: `图片 "${filename}" 不存在`,
        availableFiles: files,
      };
    }
    
    const filepath = path.join(uploadsDir, matchedFile);
    const result = await analyzeImage(filepath, question);
    
    return {
      filename: matchedFile,
      ...result,
    };
  } catch (error: any) {
    return {
      error: "图片分析失败",
      message: error.message,
    };
  }
}

/**
 * 文档创建工具
 */
async function createDocumentTool(filename: string, content: string, format: string, options?: any) {
  try {
    const path = require('path');
    const { PassThrough } = require('stream');
    const XLSX = require('xlsx');
    const fs = require('fs');

    let buffer: Buffer | null = null;
    let outFilename = filename;
    let mime = 'application/octet-stream';

    switch (format) {
      case 'markdown': {
        if (!outFilename.endsWith('.md')) outFilename += '.md';
        mime = 'text/markdown; charset=utf-8';
        buffer = Buffer.from(content, 'utf-8');
        break;
      }
      case 'text': {
        if (!outFilename.endsWith('.txt')) outFilename += '.txt';
        mime = 'text/plain; charset=utf-8';
        buffer = Buffer.from(content, 'utf-8');
        break;
      }
      case 'json': {
        if (!outFilename.endsWith('.json')) outFilename += '.json';
        mime = 'application/json; charset=utf-8';
        const jsonData = typeof content === 'string' ? JSON.parse(content) : content;
        buffer = Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8');
        break;
      }
      case 'word': {
        // Vercel环境不支持Word创建（officegen已移除）
        if (process.env.VERCEL) {
          throw new Error('Word文档创建功能暂不支持生产环境，请使用Markdown格式');
        }
        // 本地环境提示Word功能已禁用
        throw new Error('Word文档创建功能已禁用，请使用Markdown格式替代');
      }
      case 'excel': {
        if (!outFilename.endsWith('.xlsx')) outFilename += '.xlsx';
        mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const data = options?.data || [[content]];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, options?.sheetName || 'Sheet1');
        const arrayBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        buffer = Buffer.from(arrayBuf);
        break;
      }
      default:
        throw new Error(`不支持的文档格式: ${format}`);
    }

    if (!buffer) throw new Error('生成文档失败');

    const token = await registerDownload(buffer, outFilename, mime);
    // 生成完整的可访问 URL（在生产环境中会使用实际域名）
    const baseUrl = resolveBaseUrl();
    const download_url = `${baseUrl}/api/download?token=${token}`;

    return {
      success: true,
      filename: outFilename,
      format,
      size: buffer.length,
      download_url,
      note: `✅ 文档已生成，点击下载: ${download_url}`,
    };
  } catch (error: any) {
    console.error('文档创建错误:', error);
    return {
      error: "文档创建失败",
      message: error.message,
      filename: filename,
      format: format,
    };
  }
}

/**
 * 文件系统操作工具
 */
async function fileOperationsTool(operation: string, filepath?: string, newPath?: string) {
  try {
    let result: any = {};

    switch (operation) {
      case 'list':
        result = await listDirectory(filepath || 'uploads');
        result.note = `✅ 目录列表: ${result.totalItems} 个项目`;
        break;
      
      case 'create_dir':
        if (!filepath) throw new Error("缺少路径参数");
        const dirPath = await createDirectory(filepath);
        result = {
          success: true,
          path: filepath,
          fullPath: dirPath,
          note: `✅ 文件夹已创建: ${filepath}`,
        };
        break;
      
      case 'delete':
        if (!filepath) throw new Error("缺少路径参数");
        const deleted = await deleteFile(filepath);
        result = {
          success: deleted,
          path: filepath,
          note: deleted ? `✅ 文件已删除: ${filepath}` : '文件不存在',
        };
        break;
      
      case 'move':
        if (!filepath || !newPath) throw new Error("缺少路径参数");
        const movedPath = await moveFile(filepath, newPath);
        result = {
          success: true,
          oldPath: filepath,
          newPath: newPath,
          note: `✅ 文件已移动: ${filepath} → ${newPath}`,
        };
        break;
      
      case 'copy':
        if (!filepath || !newPath) throw new Error("缺少路径参数");
        const copiedPath = await copyFileOp(filepath, newPath);
        result = {
          success: true,
          sourcePath: filepath,
          destPath: newPath,
          note: `✅ 文件已复制: ${filepath} → ${newPath}`,
        };
        break;
      
      case 'rename':
        if (!filepath || !newPath) throw new Error("缺少文件名参数");
        const renamedPath = await renameFile(filepath, newPath);
        result = {
          success: true,
          oldName: filepath,
          newName: newPath,
          note: `✅ 文件已重命名: ${filepath} → ${newPath}`,
        };
        break;
      
      case 'info':
        if (!filepath) throw new Error("缺少路径参数");
        result = await getFileInfo(filepath);
        result.note = `✅ 文件信息已获取`;
        break;
      
      default:
        throw new Error(`不支持的操作: ${operation}`);
    }

    return result;
  } catch (error: any) {
    return {
      error: "文件操作失败",
      message: error.message,
      operation: operation,
      path: filepath,
    };
  }
}

/**
 * AI 自主创建并执行工作流
 */
async function createAndExecuteWorkflow(taskDescription: string, autoExecute: boolean = true) {
  try {
    // AI 规划工作流
    console.log('AI 正在规划工作流:', taskDescription);
    const plannedWorkflow = await planWorkflow(taskDescription);

    // 验证工作流
    const validation = validateWorkflow(plannedWorkflow);
    if (!validation.valid) {
      return {
        error: "工作流验证失败",
        errors: validation.errors,
        workflow: plannedWorkflow,
      };
    }

    // 保存工作流
    const savedWorkflow = workflowManager.createWorkflow({
      name: plannedWorkflow.name,
      description: plannedWorkflow.description,
      steps: plannedWorkflow.steps,
      startStep: plannedWorkflow.startStep,
      variables: plannedWorkflow.variables,
      tags: plannedWorkflow.tags,
    });

    if (autoExecute) {
      // 立即执行工作流
      const engine = new WorkflowEngine(savedWorkflow);
      const execution = await engine.execute();

      return {
        workflow: savedWorkflow,
        execution: execution,
        message: `✅ 工作流已创建并执行完成！`,
        workflowId: savedWorkflow.id,
        executionId: execution.id,
        steps: execution.logs,
        results: execution.results,
        note: "✅ AI 自主规划并执行工作流",
      };
    } else {
      return {
        workflow: savedWorkflow,
        message: "✅ 工作流已创建，可以手动执行",
        workflowId: savedWorkflow.id,
        note: "工作流已保存，点击执行按钮运行",
      };
    }
  } catch (error: any) {
    console.error('工作流创建失败:', error);
    return {
      error: "工作流创建失败",
      message: error.message,
      taskDescription: taskDescription,
    };
  }
}

/**
 * 数学计算
 */
async function calculate(expression: string) {
  try {
    const math = require('mathjs');
    const result = math.evaluate(expression);
    return { expression, result, status: "success" };
  } catch (error: any) {
    return { expression, error: "计算错误", message: error.message };
  }
}

/**
 * 数据可视化工具
 */
async function createChartTool(chartType: string, labels: string[], values: number[], title?: string) {
  try {
    // 直接生成 HTML 内容，注册为下载（不落盘）
    const titleText = title || '数据图表';
    const data = {
      labels,
      datasets: [
        {
          label: titleText,
          data: values,
          backgroundColor: labels.map((_, i) => `hsla(${(i * 60) % 360}, 70%, 50%, 0.8)`),
          borderColor: labels.map((_, i) => `hsl(${(i * 60) % 360}, 70%, 50%)`),
          borderWidth: 2,
        },
      ],
    };
    const html = `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${titleText}</title>\n<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>\n</head>\n<body style="padding:20px;background:#f5f5f5">\n<div style="max-width:900px;margin:0 auto;background:#fff;padding:30px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1)">\n<h1 style="color:#1e3a8a;margin-bottom:20px">${titleText}</h1>\n<canvas id="c"></canvas>\n</div>\n<script>\nconst ctx = document.getElementById('c');\nnew Chart(ctx, ${JSON.stringify({ type: chartType, data, options: { responsive: true } })});\n</script>\n</body>\n</html>`;
    const buffer = Buffer.from(html, 'utf-8');
    const filename = `${chartType}_chart_${Date.now()}.html`;
    const token = await registerDownload(buffer, filename, 'text/html; charset=utf-8');
    // 生成完整的可访问 URL（在生产环境中会使用实际域名）
    const baseUrl = resolveBaseUrl();
    const download_url = `${baseUrl}/api/download?token=${token}`;

    return {
      success: true,
      chartType,
      filename,
      size: buffer.length,
      download_url,
      note: `✅ 图表已生成，点击下载: ${download_url}`,
    };
  } catch (error: any) {
    return {
      error: "图表生成失败",
      message: error.message,
      chartType: chartType,
    };
  }
}

/**
 * OCR 识别工具
 */
async function ocrRecognizeTool(imageFilename: string, language: string = 'chi_sim+eng') {
  try {
    const fs = require('fs');
    const path = require('path');

    // 查找图片文件
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const files = fs.readdirSync(uploadsDir);

    const matchedFile = files.find((file: string) =>
      file === imageFilename ||
      file.includes(imageFilename) ||
      imageFilename.includes(file)
    );

    if (!matchedFile) {
      return {
        error: "图片未找到",
        message: `图片 "${imageFilename}" 不存在`,
        availableFiles: files.filter((f: string) => /\.(jpg|jpeg|png|gif|bmp)$/i.test(f)),
      };
    }

    const filepath = path.join(uploadsDir, matchedFile);
    const result = await recognizeText(filepath, language);

    return {
      filename: matchedFile,
      ...result,
    };
  } catch (error: any) {
    return {
      error: "OCR 识别失败",
      message: error.message,
      note: "OCR 功能需要下载语言包，首次使用可能较慢",
    };
  }
}

/**
 * 邮件发送工具
 */
async function sendEmailTool(to: string, subject: string, content: string, attachmentPath?: string) {
  try {
    let result;

    if (attachmentPath) {
      result = await sendEmailWithAttachment(to, subject, content, attachmentPath);
    } else {
      result = await sendEmail(to, subject, content);
    }

    return result;
  } catch (error: any) {
    return {
      error: "邮件发送失败",
      message: error.message,
      to: to,
    };
  }
}

/**
 * 工作区操作工具
 */
async function workspaceOperationTool(action: string, filePath?: string, content?: string, query?: string) {
  try {
    let result: any = {};

    switch (action) {
      case 'set':
        if (!filePath) throw new Error("需要提供工作区路径");
        result = await setWorkspace(filePath);
        break;

      case 'scan':
        result = await scanWorkspace();
        result.currentWorkspace = getCurrentWorkspace();
        break;

      case 'read':
        if (!filePath) throw new Error("需要提供文件路径");
        result = await readFileInWorkspace(filePath);
        break;

      case 'write':
        if (!filePath || !content) throw new Error("需要提供文件路径和内容");
        result = await writeFileInWorkspace(filePath, content);
        break;

      case 'create_folder':
        if (!filePath) throw new Error("需要提供文件夹路径");
        result = await createFolderInWorkspace(filePath);
        break;

      case 'delete':
        if (!filePath) throw new Error("需要提供文件路径");
        result = await deleteFileInWorkspace(filePath);
        break;

      case 'search':
        if (!query) throw new Error("需要提供搜索关键词");
        result = await searchInWorkspace(query, filePath);
        break;

      case 'info':
        result = await getWorkspaceInfo();
        break;

      default:
        throw new Error(`不支持的操作: ${action}`);
    }

    return result;
  } catch (error: any) {
    return {
      error: "工作区操作失败",
      message: error.message,
      action: action,
    };
  }
}

/**
 * 天气查询
 */
async function getCurrentWeather(location: string, unit: string = "celsius") {
  const weatherData: any = {
    北京: { temp: 15, condition: "晴朗", humidity: 45 },
    上海: { temp: 20, condition: "多云", humidity: 60 },
    广州: { temp: 25, condition: "阴天", humidity: 75 },
    深圳: { temp: 26, condition: "晴朗", humidity: 70 },
  };

  const weather = weatherData[location] || { temp: 20, condition: "晴朗", humidity: 50 };

  return {
    location,
    temperature: unit === "fahrenheit" ? (weather.temp * 9/5 + 32) : weather.temp,
    unit: unit === "fahrenheit" ? "°F" : "°C",
    condition: weather.condition,
    humidity: weather.humidity + "%",
    note: "💡 提示：这是模拟数据。",
  };
}

/**
 * 获取 Aspose Cloud Access Token
 */
async function getAsposeAccessToken(): Promise<string> {
  const axios = require('axios');
  
  const clientId = process.env.ASPOSE_CLIENT_ID || '43287341-617f-4d95-9caa-b166d46fbb8d';
  const clientSecret = process.env.ASPOSE_CLIENT_SECRET || '1c0df04fbde71bcfbc75cbe6f3d297bf';
  
  try {
    const response = await axios.post(
      'https://api.aspose.cloud/connect/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    return response.data.access_token;
  } catch (error: any) {
    console.error('获取 Aspose Token 失败:', error.message);
    throw new Error('获取 Aspose Token 失败: ' + error.message);
  }
}

/**
 * 创建 PowerPoint 演示文稿
 */
async function createPresentation(
  filename: string,
  slides: Array<{ title: string; content: string }>,
  presentationTitle?: string
) {
  const axios = require('axios');
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log(`📊 开始创建 PPT: ${filename}, 幻灯片数: ${slides.length}`);
    
    // 1. 获取 Access Token
    const accessToken = await getAsposeAccessToken();
    console.log('✅ Aspose Token 获取成功');
    
    // 2. 创建新的演示文稿（使用正确的 API 调用）
    const pptxName = `${filename}.pptx`;
    const createResponse = await axios.post(
      `https://api.aspose.cloud/v3.0/slides/${pptxName}`,
      null,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          password: '',
          folder: '',
          storage: ''
        },
        timeout: 30000,
      }
    );
    
    console.log(`✅ 演示文稿创建成功: ${pptxName}`);
    
    // 3. 删除默认的第一张空白幻灯片（Aspose 会自动创建）
    await axios.delete(
      `https://api.aspose.cloud/v3.0/slides/${pptxName}/slides/1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    // 4. 添加封面（如果提供了总标题）
    if (presentationTitle) {
      await addTitleSlide(accessToken, pptxName, presentationTitle);
      console.log(`✅ 添加封面: ${presentationTitle}`);
    }
    
    // 5. 添加内容幻灯片
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      await addContentSlide(accessToken, pptxName, slide.title, slide.content, i + 1);
      console.log(`✅ 添加幻灯片 ${i + 1}/${slides.length}: ${slide.title}`);
    }
    
    // 6. 下载生成的 PPTX 文件
    const downloadResponse = await axios.get(
      `https://api.aspose.cloud/v3.0/slides/${pptxName}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        responseType: 'arraybuffer',
        timeout: 60000,
      }
    );
    
    // 7. 保存文件
    const outputDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, pptxName);
    fs.writeFileSync(outputPath, downloadResponse.data);
    
    // 8. 注册下载
    const fileBuffer = Buffer.from(downloadResponse.data);
    const downloadToken = await registerDownload(fileBuffer, pptxName, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    const downloadUrl = `/api/download/${downloadToken}`;
    
    console.log(`✅ PPT 生成成功: ${pptxName}`);
    
    return {
      success: true,
      filename: pptxName,
      path: outputPath,
      downloadUrl: downloadUrl,
      slides: slides.length,
      note: `✅ 演示文稿创建成功，共 ${slides.length} 张幻灯片`,
    };
    
  } catch (error: any) {
    console.error('创建 PPT 失败:', error.message);
    
    return {
      error: "PPT 创建失败",
      message: error.message,
      details: error.response?.data || error.toString(),
      note: "请检查 Aspose API 配置和网络连接",
    };
  }
}

/**
 * 添加标题幻灯片（封面）
 */
async function addTitleSlide(accessToken: string, pptxName: string, title: string) {
  const axios = require('axios');
  
  // 添加新幻灯片
  await axios.post(
    `https://api.aspose.cloud/v3.0/slides/${pptxName}/slides`,
    { layoutSlide: { type: 'Title' } },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  // 添加标题文本框
  await axios.post(
    `https://api.aspose.cloud/v3.0/slides/${pptxName}/slides/1/shapes`,
    {
      shapeType: 'Rectangle',
      x: 50,
      y: 150,
      width: 600,
      height: 100,
      text: title,
      textFrameFormat: {
        centerText: 'True',
      },
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * 添加内容幻灯片
 */
async function addContentSlide(
  accessToken: string,
  pptxName: string,
  title: string,
  content: string,
  slideIndex: number
) {
  const axios = require('axios');
  
  // 添加新幻灯片
  await axios.post(
    `https://api.aspose.cloud/v3.0/slides/${pptxName}/slides`,
    { layoutSlide: { type: 'TitleAndObject' } },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const actualSlideIndex = slideIndex + 1; // 考虑封面
  
  // 添加标题文本框
  await axios.post(
    `https://api.aspose.cloud/v3.0/slides/${pptxName}/slides/${actualSlideIndex}/shapes`,
    {
      shapeType: 'Rectangle',
      x: 50,
      y: 40,
      width: 620,
      height: 60,
      text: title,
      textFrameFormat: {
        centerText: 'False',
      },
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  // 添加内容文本框
  await axios.post(
    `https://api.aspose.cloud/v3.0/slides/${pptxName}/slides/${actualSlideIndex}/shapes`,
    {
      shapeType: 'Rectangle',
      x: 50,
      y: 120,
      width: 620,
      height: 360,
      text: content,
      textFrameFormat: {
        centerText: 'False',
      },
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * 文档格式转换（使用 Aspose Cloud API）
 */
async function convertDocument(
  inputFile: string,
  outputFormat: string,
  outputFilename?: string
) {
  const axios = require('axios');
  const fs = require('fs');
  const path = require('path');
  const FormData = require('form-data');
  
  try {
    console.log(`🔄 开始文档转换: ${inputFile} → ${outputFormat}`);
    
    // 1. 获取 Access Token
    const accessToken = await getAsposeAccessToken();
    
    // 2. 读取输入文件
    const inputPath = path.join(process.cwd(), 'uploads', inputFile);
    if (!fs.existsSync(inputPath)) {
      return { error: "文件不存在", path: inputPath };
    }
    
    const fileBuffer = fs.readFileSync(inputPath);
    const inputExt = path.extname(inputFile).toLowerCase();
    
    // 3. 根据文件类型选择合适的 API
    let apiUrl = '';
    let conversionResult;
    
    if (inputExt === '.docx' || inputExt === '.doc') {
      // Word 转换
      apiUrl = `https://api.aspose.cloud/v4.0/words/convert?format=${outputFormat}`;
    } else if (inputExt === '.xlsx' || inputExt === '.xls') {
      // Excel 转换
      apiUrl = `https://api.aspose.cloud/v3.0/cells/convert?format=${outputFormat}`;
    } else if (inputExt === '.pptx' || inputExt === '.ppt') {
      // PowerPoint 转换
      apiUrl = `https://api.aspose.cloud/v3.0/slides/convert/${outputFormat}`;
    } else if (inputExt === '.pdf') {
      // PDF 转换
      apiUrl = `https://api.aspose.cloud/v3.0/pdf/convert/${outputFormat}`;
    } else {
      return { error: "不支持的文件类型", extension: inputExt };
    }
    
    // 4. 上传并转换
    const formData = new FormData();
    formData.append('file', fileBuffer, inputFile);
    
    const response = await axios.put(
      apiUrl,
      fileBuffer,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
        responseType: 'arraybuffer',
        timeout: 60000,
      }
    );
    
    // 5. 保存转换后的文件
    const outputName = outputFilename 
      ? `${outputFilename}.${outputFormat}` 
      : inputFile.replace(inputExt, `.${outputFormat}`);
    
    const outputDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, outputName);
    fs.writeFileSync(outputPath, response.data);
    
    // 6. 注册下载
    const outputBuffer = Buffer.from(response.data);
    const mimeMap: any = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'html': 'text/html',
      'txt': 'text/plain',
      'png': 'image/png',
      'jpg': 'image/jpeg',
    };
    const downloadToken = await registerDownload(outputBuffer, outputName, mimeMap[outputFormat] || 'application/octet-stream');
    const downloadUrl = `/api/download/${downloadToken}`;
    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
    
    console.log(`✅ 文档转换成功: ${outputName}`);
    
    return {
      success: true,
      inputFile: inputFile,
      outputFile: outputName,
      outputFormat: outputFormat,
      path: outputPath,
      downloadUrl: downloadUrl,
      size: `${fileSize} KB`,
      note: `✅ 文档已转换为 ${outputFormat.toUpperCase()} 格式`,
    };
    
  } catch (error: any) {
    console.error('文档转换失败:', error.message);
    return {
      error: "文档转换失败",
      message: error.message,
      details: error.response?.data?.toString() || error.toString(),
    };
  }
}

/**
 * 从 PDF 提取文本
 */
async function extractPdfText(filename: string, pageNumber?: number) {
  const axios = require('axios');
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log(`📄 提取 PDF 文本: ${filename}${pageNumber ? ` (第${pageNumber}页)` : ' (全部)'}`);
    
    // 1. 获取 Access Token
    const accessToken = await getAsposeAccessToken();
    
    // 2. 读取 PDF 文件
    const inputPath = path.join(process.cwd(), 'uploads', filename);
    if (!fs.existsSync(inputPath)) {
      return { error: "文件不存在", path: inputPath };
    }
    
    const fileBuffer = fs.readFileSync(inputPath);
    
    // 3. 上传文件到云端
    const uploadResponse = await axios.put(
      `https://api.aspose.cloud/v3.0/pdf/storage/file/${filename}`,
      fileBuffer,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    // 4. 提取文本
    const textUrl = pageNumber 
      ? `https://api.aspose.cloud/v3.0/pdf/${filename}/pages/${pageNumber}/text`
      : `https://api.aspose.cloud/v3.0/pdf/${filename}/text`;
    
    const textResponse = await axios.get(textUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    // 5. 清理云端文件
    await axios.delete(
      `https://api.aspose.cloud/v3.0/pdf/storage/file/${filename}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    ).catch(() => {});
    
    const extractedText = textResponse.data.text?.textItems?.list || [];
    const fullText = extractedText.map((item: any) => item.text).join(' ');
    
    console.log(`✅ 提取成功，共 ${fullText.length} 字符`);
    
    return {
      success: true,
      filename: filename,
      page: pageNumber || "全部",
      text: fullText,
      length: fullText.length,
      note: `✅ 成功提取 ${fullText.length} 字符`,
    };
    
  } catch (error: any) {
    console.error('PDF 文本提取失败:', error.message);
    return {
      error: "PDF 文本提取失败",
      message: error.message,
    };
  }
}

/**
 * 图片 OCR 识别
 */
async function ocrImage(filename: string, language: string = 'auto') {
  const axios = require('axios');
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log(`🔍 OCR 识别: ${filename}, 语言=${language}`);
    
    // 1. 获取 Access Token
    const accessToken = await getAsposeAccessToken();
    
    // 2. 读取图片文件
    const inputPath = path.join(process.cwd(), 'uploads', filename);
    if (!fs.existsSync(inputPath)) {
      return { error: "文件不存在", path: inputPath };
    }
    
    const fileBuffer = fs.readFileSync(inputPath);
    
    // 3. 调用 OCR API
    const languageMap: any = {
      'auto': 'Auto',
      'chinese': 'Chinese',
      'english': 'English',
    };
    
    const response = await axios.post(
      'https://api.aspose.cloud/v5.0/ocr/RecognizeImage',
      fileBuffer,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
        params: {
          language: languageMap[language] || 'Auto',
          makeSkewCorrect: true,
          makeBinarization: true,
        },
        timeout: 60000,
      }
    );
    
    const recognizedText = response.data.text || '';
    
    console.log(`✅ OCR 识别成功，识别出 ${recognizedText.length} 字符`);
    
    return {
      success: true,
      filename: filename,
      language: language,
      text: recognizedText,
      length: recognizedText.length,
      note: `✅ 成功识别 ${recognizedText.length} 字符`,
    };
    
  } catch (error: any) {
    console.error('OCR 识别失败:', error.message);
    return {
      error: "OCR 识别失败",
      message: error.message,
      details: error.response?.data || error.toString(),
    };
  }
}

/**
 * 生成二维码
 */
async function generateQRCode(text: string, filename: string, size: number = 300) {
  const axios = require('axios');
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log(`📱 生成二维码: ${text.substring(0, 50)}...`);
    
    // 1. 获取 Access Token
    const accessToken = await getAsposeAccessToken();
    
    // 2. 调用 BarCode API 生成二维码
    const response = await axios.get(
      'https://api.aspose.cloud/v3.0/barcode/generate',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          type: 'QR',
          text: text,
          format: 'png',
          resolutionX: size,
          resolutionY: size,
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    );
    
    // 3. 保存二维码图片
    const outputName = `${filename}.png`;
    const outputDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, outputName);
    fs.writeFileSync(outputPath, response.data);
    
    // 4. 注册下载
    const fileBuffer = Buffer.from(response.data);
    const downloadToken = await registerDownload(fileBuffer, outputName, 'image/png');
    const downloadUrl = `/api/download/${downloadToken}`;
    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
    
    console.log(`✅ 二维码生成成功: ${outputName}`);
    
    return {
      success: true,
      filename: outputName,
      text: text,
      size: `${size}x${size}`,
      path: outputPath,
      downloadUrl: downloadUrl,
      fileSize: `${fileSize} KB`,
      note: `✅ 二维码已生成 (${size}x${size} px)`,
    };
    
  } catch (error: any) {
    console.error('二维码生成失败:', error.message);
    return {
      error: "二维码生成失败",
      message: error.message,
      details: error.response?.data?.toString() || error.toString(),
    };
  }
}

// 注意：storeFileInfo 和 getAllFiles 已在函数声明时使用 export 导出
// uploadedFiles 不需要导出，仅内部使用

