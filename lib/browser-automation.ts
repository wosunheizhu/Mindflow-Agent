/**
 * 浏览器自动化工具
 * 使用 Playwright 实现网页自动化操作
 */

import { chromium } from 'playwright';

/**
 * 访问网页并截图
 */
export async function visitWebsite(url: string, action?: string): Promise<any> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    
    // 访问网页
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 截图
    const screenshot = await page.screenshot({ type: 'png', fullPage: false });
    const screenshotBase64 = screenshot.toString('base64');
    
    // 获取页面标题和内容
    const title = await page.title();
    const content = await page.evaluate(() => {
      // 提取主要文本内容
      const body = document.body;
      return body.innerText.substring(0, 2000); // 限制长度
    });
    
    await browser.close();
    
    return {
      url,
      title,
      content: content.substring(0, 500) + '...',
      screenshot: `data:image/png;base64,${screenshotBase64}`,
      status: 'success',
    };
  } catch (error: any) {
    if (browser) {
      await browser.close();
    }
    throw new Error(`浏览器自动化失败: ${error.message}`);
  }
}

/**
 * 在网页上执行操作
 */
export async function automateWebsite(
  url: string,
  actions: Array<{ type: string; selector?: string; value?: string }>
): Promise<any> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    const results = [];
    
    for (const action of actions) {
      switch (action.type) {
        case 'click':
          if (action.selector) {
            await page.click(action.selector);
            results.push({ action: 'click', selector: action.selector, status: 'success' });
          }
          break;
          
        case 'fill':
          if (action.selector && action.value) {
            await page.fill(action.selector, action.value);
            results.push({ action: 'fill', selector: action.selector, status: 'success' });
          }
          break;
          
        case 'screenshot':
          const screenshot = await page.screenshot({ type: 'png' });
          results.push({
            action: 'screenshot',
            screenshot: `data:image/png;base64,${screenshot.toString('base64')}`,
            status: 'success',
          });
          break;
          
        case 'extract':
          if (action.selector) {
            const text = await page.textContent(action.selector);
            results.push({ action: 'extract', selector: action.selector, text, status: 'success' });
          }
          break;
          
        default:
          results.push({ action: action.type, status: 'unknown' });
      }
      
      await page.waitForTimeout(1000);
    }
    
    await browser.close();
    
    return {
      url,
      actions: results,
      status: 'success',
    };
  } catch (error: any) {
    if (browser) {
      await browser.close();
    }
    throw new Error(`自动化操作失败: ${error.message}`);
  }
}

/**
 * 提取网页数据
 */
export async function extractWebData(url: string, selectors: string[]): Promise<any> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    const data: any = {};
    
    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        const texts = await Promise.all(
          elements.map(el => el.textContent())
        );
        data[selector] = texts.filter(t => t && t.trim());
      } catch (e) {
        data[selector] = [];
      }
    }
    
    await browser.close();
    
    return {
      url,
      data,
      status: 'success',
    };
  } catch (error: any) {
    if (browser) {
      await browser.close();
    }
    throw new Error(`数据提取失败: ${error.message}`);
  }
}

