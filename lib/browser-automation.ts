/**
 * 浏览器自动化工具
 * 注意：Playwright在Serverless环境不可用，功能已禁用
 * 生产环境建议使用在线爬虫服务或API
 */

/**
 * 访问网页并截图
 */
export async function visitWebsite(url: string, action?: string): Promise<any> {
  throw new Error('浏览器自动化功能在生产环境不可用。建议：1) 本地环境使用 2) 使用网页搜索工具替代');
}

/**
 * 在网页上执行操作
 */
export async function automateWebsite(
  url: string,
  actions: Array<{ type: string; selector?: string; value?: string }>
): Promise<any> {
  throw new Error('浏览器自动化功能在生产环境不可用。建议：1) 本地环境使用 2) 使用API调用工具替代');
}

/**
 * 提取网页数据
 */
export async function extractWebData(url: string, selectors: string[]): Promise<any> {
  throw new Error('网页数据提取功能在生产环境不可用。建议：1) 本地环境使用 2) 使用网页搜索工具替代');
}
