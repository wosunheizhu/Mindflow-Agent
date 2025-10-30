/**
 * 自定义工具和函数定义 - 集成 Brave Search 版本
 * 特点：高质量搜索结果，2000次/月免费
 */

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
      description: "执行 Python 代码并返回结果。可用于数据分析、计算、绘图等。",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "要执行的 Python 代码",
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
      name: "get_current_weather",
      description: "获取指定城市的当前天气信息",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "城市名称，例如：北京、上海",
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "温度单位",
          },
        },
        required: ["location"],
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
      name: "search_files",
      description: "在上传的文件中搜索信息",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "搜索查询",
          },
          file_types: {
            type: "array",
            items: {
              type: "string",
            },
            description: "文件类型过滤",
          },
        },
        required: ["query"],
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
    
    case "get_current_weather":
      return await getCurrentWeather(args.location, args.unit);
    
    case "calculate":
      return await calculate(args.expression);
    
    case "search_files":
      return await searchFiles(args.query, args.file_types);
    
    default:
      return { error: "未知的工具" };
  }
}

// 工具实现函数

/**
 * 网页搜索 - Brave Search API
 * 优点：高质量搜索结果，2000次/月免费
 */
async function searchWeb(query: string) {
  try {
    // 检查是否配置了 API 密钥
    if (!process.env.BRAVE_API_KEY) {
      return {
        results: [{
          title: `关于 "${query}" 的搜索结果`,
          snippet: "未配置 Brave Search API。请在 .env.local 中设置 BRAVE_API_KEY",
          url: "https://brave.com/search/api/",
        }],
        note: "⚠️ 请配置 Brave Search API 以启用真实搜索",
        isSimulated: true,
      };
    }

    const axios = require('axios');
    
    // Brave Search API
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: {
        q: query,
        count: 5,  // 返回 5 个结果
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': process.env.BRAVE_API_KEY,
      },
      timeout: 10000,
    });

    const data = response.data;

    if (!data.web || !data.web.results || data.web.results.length === 0) {
      return {
        results: [],
        note: "未找到相关结果",
        query: query,
      };
    }

    // 格式化搜索结果
    const results = data.web.results.map((item: any) => ({
      title: item.title,
      snippet: item.description,
      url: item.url,
      age: item.age || null,
      source: 'Brave Search',
    }));

    return {
      results: results,
      query: query,
      totalResults: results.length,
      source: 'Brave Search API',
      note: "✅ 使用 Brave Search API（高质量结果）",
      isSimulated: false,
    };
  } catch (error: any) {
    console.error('Brave Search API 错误:', error.message);
    
    // 降级到模拟模式
    return {
      results: [{
        title: `关于 "${query}" 的搜索结果`,
        snippet: "搜索服务暂时不可用。请检查 API 配置或网络连接。",
        url: "https://search.brave.com",
      }],
      error: error.message,
      note: "⚠️ Brave Search API 调用失败，已降级到模拟模式",
      isSimulated: true,
    };
  }
}

/**
 * 代码执行 - Judge0 API 版本（已配置）
 */
async function executeCode(code: string, language: string = "python") {
  try {
    // 检查是否配置了 API 密钥
    if (!process.env.JUDGE0_API_KEY) {
      return {
        output: `代码执行模拟结果：\n代码：${code}\n\n⚠️ 未配置 Judge0 API。请在 .env.local 中设置 JUDGE0_API_KEY`,
        language,
        status: "模拟模式",
        isSimulated: true,
      };
    }

    const axios = require('axios');
    
    // 语言 ID 映射
    const languageIds: any = {
      python: 71,      // Python 3
      javascript: 63,  // JavaScript (Node.js)
    };

    const languageId = languageIds[language] || 71;

    // 提交代码执行
    const submitResponse = await axios.post(
      'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true',
      {
        source_code: code,
        language_id: languageId,
        stdin: "",
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        timeout: 10000,
      }
    );

    const result = submitResponse.data;

    // 处理输出
    let output = '';
    if (result.stdout) {
      output = result.stdout;
    } else if (result.stderr) {
      output = `错误：\n${result.stderr}`;
    } else if (result.compile_output) {
      output = `编译错误：\n${result.compile_output}`;
    } else {
      output = '代码执行完成，无输出';
    }

    return {
      output: output,
      language: language,
      status: result.status.description,
      time: result.time ? `${result.time}s` : null,
      memory: result.memory ? `${result.memory}KB` : null,
      isSimulated: false,
    };
  } catch (error: any) {
    console.error('Judge0 API 错误:', error.message);
    return {
      output: `执行失败：${error.message}`,
      error: "代码执行失败",
      message: error.message,
      note: "请检查 Judge0 API 配置或网络连接",
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
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size as any,
    });

    return {
      image_url: response.data[0].url,
      prompt: prompt,
      size: size,
    };
  } catch (error: any) {
    return {
      error: "图像生成失败",
      message: error.message,
      note: "💡 提示：确保 API 密钥有 DALL-E 访问权限。",
    };
  }
}

/**
 * 天气查询（模拟版本）
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
 * 数学计算
 */
async function calculate(expression: string) {
  try {
    const math = require('mathjs');
    const result = math.evaluate(expression);
    return {
      expression,
      result,
      status: "success",
    };
  } catch (error: any) {
    return {
      expression,
      error: "计算错误",
      message: error.message,
    };
  }
}

/**
 * 文件搜索（模拟版本）
 */
async function searchFiles(query: string, fileTypes?: string[]) {
  return {
    results: [
      {
        file: "document.pdf",
        page: 5,
        snippet: `找到与 "${query}" 相关的内容...`,
      },
    ],
    note: "💡 提示：这是模拟结果。",
  };
}

