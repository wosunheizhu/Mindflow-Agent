/**
 * 图片分析工具
 * 使用 GPT-4 Vision API
 */

import OpenAI from "openai";
import { readFile } from "fs/promises";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * 分析图片内容
 */
export async function analyzeImage(filepath: string, question?: string): Promise<any> {
  try {
    // 读取图片文件
    const imageBuffer = await readFile(filepath);
    const base64Image = imageBuffer.toString('base64');
    
    // 检测图片格式
    const ext = filepath.toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext.endsWith('.png')) mimeType = 'image/png';
    else if (ext.endsWith('.gif')) mimeType = 'image/gif';
    else if (ext.endsWith('.webp')) mimeType = 'image/webp';
    
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    
    // 使用 GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // gpt-4o 支持视觉
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: question || "请详细描述这张图片的内容，包括主要元素、颜色、风格、氛围等。",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 8000,
    });

    return {
      analysis: response.choices[0].message.content,
      model: "gpt-4o",
      imageUrl: imageUrl,
      note: "✅ 使用 GPT-4o Vision 分析图片",
    };
  } catch (error: any) {
    console.error('图片分析错误:', error);
    throw new Error(`图片分析失败: ${error.message}`);
  }
}

/**
 * 比较两张图片
 */
export async function compareImages(filepath1: string, filepath2: string): Promise<any> {
  try {
    const image1Buffer = await readFile(filepath1);
    const image2Buffer = await readFile(filepath2);
    
    const base64Image1 = image1Buffer.toString('base64');
    const base64Image2 = image2Buffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请比较这两张图片，说明它们的相同点和不同点。",
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image1}` },
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image2}` },
            },
          ],
        },
      ],
      max_tokens: 8000,
    });

    return {
      comparison: response.choices[0].message.content,
      note: "✅ 使用 GPT-4o Vision 对比图片",
    };
  } catch (error: any) {
    throw new Error(`图片对比失败: ${error.message}`);
  }
}

