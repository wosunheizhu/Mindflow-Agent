/**
 * 高级工具集
 * 包含 API调用、翻译、时间处理、文本处理、数据转换
 */

/**
 * 通用 API 调用器
 */
export async function callAPI(url: string, method: string = 'GET', data?: any, headers?: any): Promise<any> {
  try {
    const axios = require('axios');
    
    const config: any = {
      method: method.toUpperCase(),
      url: url,
      headers: headers || {},
      timeout: 10000,
    };

    if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
      config.data = data;
    }

    const response = await axios(config);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      note: `✅ API 调用成功: ${method} ${url}`,
    };
  } catch (error: any) {
    return {
      error: "API 调用失败",
      message: error.message,
      status: error.response?.status,
      url: url,
    };
  }
}

/**
 * 文本翻译（使用 LibreTranslate 免费 API）
 */
export async function translateText(text: string, targetLang: string = 'zh', sourceLang: string = 'auto'): Promise<any> {
  try {
    const axios = require('axios');
    
    // 使用免费的 LibreTranslate API
    const response = await axios.post('https://libretranslate.com/translate', {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text',
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    return {
      original: text,
      translated: response.data.translatedText,
      sourceLang: sourceLang,
      targetLang: targetLang,
      note: `✅ 翻译完成（${sourceLang} → ${targetLang}）`,
    };
  } catch (error: any) {
    return {
      error: "翻译失败",
      message: error.message,
      original: text,
      note: "使用免费的 LibreTranslate API",
    };
  }
}

/**
 * 时间日期工具
 */
export function dateTimeOperation(operation: string, dateInput?: string, format?: string, timezone?: string): any {
  try {
    const now = dateInput ? new Date(dateInput) : new Date();

    switch (operation) {
      case 'current':
        return {
          datetime: now.toISOString(),
          formatted: now.toLocaleString('zh-CN'),
          timestamp: now.getTime(),
          timezone: timezone || 'Asia/Shanghai',
        };

      case 'format':
        return {
          datetime: now.toISOString(),
          formatted: format ? now.toLocaleString('zh-CN', { timeZone: timezone }) : now.toLocaleString('zh-CN'),
          timestamp: now.getTime(),
        };

      case 'add_days':
        const days = parseInt(format || '1');
        const newDate = new Date(now);
        newDate.setDate(newDate.getDate() + days);
        return {
          original: now.toLocaleDateString('zh-CN'),
          result: newDate.toLocaleDateString('zh-CN'),
          days: days,
        };

      case 'diff':
        const targetDate = new Date(format || new Date());
        const diffMs = targetDate.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return {
          from: now.toLocaleDateString('zh-CN'),
          to: targetDate.toLocaleDateString('zh-CN'),
          days: Math.abs(diffDays),
          note: diffDays > 0 ? `还有 ${diffDays} 天` : `已过 ${Math.abs(diffDays)} 天`,
        };

      case 'parse':
        return {
          input: dateInput,
          parsed: now.toLocaleString('zh-CN'),
          timestamp: now.getTime(),
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
          weekday: ['日', '一', '二', '三', '四', '五', '六'][now.getDay()],
        };

      default:
        return {
          error: "不支持的操作",
          supportedOps: ['current', 'format', 'add_days', 'diff', 'parse'],
        };
    }
  } catch (error: any) {
    return {
      error: "日期处理失败",
      message: error.message,
    };
  }
}

/**
 * 文本处理工具
 */
export function processText(operation: string, text: string, params?: any): any {
  try {
    switch (operation) {
      case 'count':
        return {
          text: text.substring(0, 100) + '...',
          characters: text.length,
          words: text.split(/\s+/).filter(w => w).length,
          lines: text.split('\n').length,
          paragraphs: text.split(/\n\n+/).filter(p => p.trim()).length,
        };

      case 'extract':
        const pattern = params?.pattern || params;
        const regex = new RegExp(pattern, 'g');
        const matches = text.match(regex) || [];
        return {
          pattern: pattern,
          matches: matches,
          count: matches.length,
        };

      case 'replace':
        const find = params?.find || params;
        const replace = params?.replace || '';
        const result = text.replace(new RegExp(find, 'g'), replace);
        return {
          original: text.substring(0, 100) + '...',
          result: result.substring(0, 100) + '...',
          replacements: (text.match(new RegExp(find, 'g')) || []).length,
        };

      case 'format':
        const formatted = params?.uppercase ? text.toUpperCase() :
                         params?.lowercase ? text.toLowerCase() :
                         params?.capitalize ? text.charAt(0).toUpperCase() + text.slice(1) :
                         text;
        return {
          original: text.substring(0, 100) + '...',
          formatted: formatted.substring(0, 100) + '...',
          operation: params,
        };

      case 'split':
        const delimiter = params?.delimiter || '\n';
        const parts = text.split(delimiter);
        return {
          delimiter: delimiter,
          parts: parts.slice(0, 10),
          totalParts: parts.length,
        };

      default:
        return {
          error: "不支持的操作",
          supportedOps: ['count', 'extract', 'replace', 'format', 'split'],
        };
    }
  } catch (error: any) {
    return {
      error: "文本处理失败",
      message: error.message,
    };
  }
}

/**
 * 数据转换工具
 */
export function convertData(data: any, fromFormat: string, toFormat: string): any {
  try {
    let parsed: any;

    // 解析输入
    switch (fromFormat.toLowerCase()) {
      case 'json':
        parsed = typeof data === 'string' ? JSON.parse(data) : data;
        break;
      case 'csv':
        parsed = parseCSV(data);
        break;
      case 'xml':
        parsed = { note: "XML 解析需要额外库" };
        break;
      default:
        throw new Error(`不支持的输入格式: ${fromFormat}`);
    }

    // 转换输出
    switch (toFormat.toLowerCase()) {
      case 'json':
        return {
          format: 'json',
          data: JSON.stringify(parsed, null, 2),
          note: `✅ ${fromFormat} → JSON 转换完成`,
        };
      case 'csv':
        return {
          format: 'csv',
          data: toCSV(parsed),
          note: `✅ ${fromFormat} → CSV 转换完成`,
        };
      case 'xml':
        return {
          format: 'xml',
          data: "XML 输出需要额外库",
          note: "可使用第三方库实现",
        };
      default:
        throw new Error(`不支持的输出格式: ${toFormat}`);
    }
  } catch (error: any) {
    return {
      error: "数据转换失败",
      message: error.message,
    };
  }
}

// CSV 解析辅助函数
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = values[i];
    });
    return obj;
  });
  return data;
}

// CSV 生成辅助函数
function toCSV(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }
  const headers = Object.keys(data[0]);
  const csvLines = [
    headers.join(','),
    ...data.map(row => headers.map(h => row[h]).join(','))
  ];
  return csvLines.join('\n');
}




