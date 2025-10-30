/**
 * 自定义工具和函数定义
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

async function searchWeb(query: string) {
  // 模拟网页搜索（实际应用中可以集成 Google、Bing API）
  return {
    results: [
      {
        title: `关于 "${query}" 的搜索结果`,
        snippet: "这是一个模拟的搜索结果。在实际应用中，这里会返回真实的网页搜索结果。",
        url: "https://example.com",
      },
    ],
    note: "💡 提示：这是模拟结果。要启用真实搜索，请集成搜索 API（如 Google Custom Search、Bing Search API）。",
  };
}

async function executeCode(code: string, language: string) {
  // 模拟代码执行（实际应用中需要沙箱环境）
  return {
    output: `代码执行模拟结果：\n代码：${code}\n\n注意：这是模拟输出。要执行真实代码，需要集成代码执行环境（如 Docker 沙箱）。`,
    language,
    status: "success",
  };
}

async function generateImage(prompt: string, size: string = "1024x1024") {
  // 实际使用 DALL-E API
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

async function getCurrentWeather(location: string, unit: string = "celsius") {
  // 模拟天气查询（实际应用中可以集成天气 API）
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

async function calculate(expression: string) {
  try {
    // 安全的数学计算
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

async function searchFiles(query: string, fileTypes?: string[]) {
  // 模拟文件搜索
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

