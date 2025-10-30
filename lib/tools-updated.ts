/**
 * 自定义工具和函数定义 - 集成真实 API 版本
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
 * 网页搜索 - Google Custom Search 版本
 */
async function searchWeb(query: string) {
  try {
    // 检查是否配置了 API 密钥
    if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CSE_ID) {
      return {
        results: [{
          title: `关于 "${query}" 的搜索结果`,
          snippet: "未配置 Google API。请在 .env.local 中设置 GOOGLE_API_KEY 和 GOOGLE_CSE_ID",
          url: "https://console.cloud.google.com/",
        }],
        note: "⚠️ 请配置 Google Custom Search API 以启用真实搜索",
        isSimulated: true,
      };
    }

    const { google } = require('googleapis');
    
    const customsearch = google.customsearch('v1');
    const res = await customsearch.cse.list({
      auth: process.env.GOOGLE_API_KEY,
      cx: process.env.GOOGLE_CSE_ID,
      q: query,
      num: 5, // 返回 5 个结果
    });

    if (!res.data.items || res.data.items.length === 0) {
      return {
        results: [],
        note: "未找到相关结果",
      };
    }

    return {
      results: res.data.items.map((item: any) => ({
        title: item.title,
        snippet: item.snippet,
        url: item.link,
      })),
      query: query,
      totalResults: res.data.searchInformation?.totalResults,
      isSimulated: false,
    };
  } catch (error: any) {
    console.error('Google Search API 错误:', error);
    return {
      error: "搜索失败",
      message: error.message,
      note: "请检查 API 密钥配置是否正确",
      isSimulated: true,
    };
  }
}

/**
 * 代码执行 - Judge0 API 版本
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
        }
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
    console.error('Judge0 API 错误:', error);
    return {
      output: `执行失败：${error.message}`,
      error: "代码执行失败",
      message: error.message,
      note: "请检查 Judge0 API 配置",
      isSimulated: true,
    };
  }
}

/**
 * 图像生成 - DALL-E 3（已有）
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
 * 天气查询（保持模拟版本）
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
    note: "💡 提示：这是模拟数据。要获取真实天气，请集成天气 API（如 OpenWeatherMap）。",
  };
}

/**
 * 数学计算（已有）
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
 * 文件搜索（保持模拟版本）
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
    note: "💡 提示：这是模拟结果。要启用真实文件搜索，需要集成向量数据库（如 Pinecone、Weaviate）。",
  };
}

