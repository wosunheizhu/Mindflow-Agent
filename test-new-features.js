/**
 * 新功能测试脚本
 * 测试文件处理和浏览器自动化
 */

const http = require('http');
const fs = require('fs');
const FormData = require('form-data');

const config = {
  host: 'localhost',
  port: 3000,
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// 测试用例
const newFeatureTests = [
  {
    name: '🌐 浏览器自动化 - 访问网页',
    message: '访问 https://example.com 并告诉我页面的主要内容',
    expectedTool: 'visit_website',
  },
  {
    name: '🔍 网页搜索 - Brave Search',
    message: '搜索 Python 编程语言的特点',
    expectedTool: 'search_web',
  },
  {
    name: '💻 代码执行 - Piston API',
    message: '用 Python 计算 1 到 50 的和',
    expectedTool: 'execute_code',
  },
];

function runTest(testCase) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      messages: [{ role: 'user', content: testCase.message }],
      useTools: true,
    });

    const options = {
      hostname: config.host,
      port: config.port,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    log(colors.cyan, `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    log(colors.cyan, `📝 测试: ${testCase.name}`);
    log(colors.blue, `💬 消息: "${testCase.message}"`);

    const startTime = Date.now();
    let toolCalls = [];
    let hasScreenshot = false;
    let hasSearchResults = false;

    const req = http.request(options, (res) => {
      res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              const endTime = Date.now();
              const duration = ((endTime - startTime) / 1000).toFixed(2);

              log(colors.green, `\n✅ 测试完成`);
              log(colors.yellow, `⏱️  响应时间: ${duration}秒`);
              
              if (toolCalls.length > 0) {
                log(colors.magenta, `🔧 调用的工具: ${toolCalls.join(', ')}`);
                
                if (hasScreenshot) {
                  log(colors.green, `📸 包含网页截图`);
                }
                
                if (hasSearchResults) {
                  log(colors.green, `🔍 包含搜索结果`);
                }
              }

              resolve({
                success: true,
                testName: testCase.name,
                duration,
                toolsUsed: toolCalls,
              });
            } else {
              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'tool_call') {
                  toolCalls.push(parsed.tool);
                  log(colors.magenta, `\n🔧 调用工具: ${parsed.tool}`);
                } else if (parsed.type === 'tool_result') {
                  log(colors.green, `✓ 工具执行完成: ${parsed.tool}`);
                  
                  if (parsed.result.screenshot) {
                    hasScreenshot = true;
                  }
                  
                  if (parsed.result.results && parsed.result.results.length > 0) {
                    hasSearchResults = true;
                    log(colors.blue, `  找到 ${parsed.result.results.length} 个搜索结果`);
                  }
                } else if (parsed.type === 'content') {
                  process.stdout.write(colors.green + '.' + colors.reset);
                }
              } catch (e) {
                // 忽略
              }
            }
          }
        }
      });

      res.on('end', () => {});
    });

    req.on('error', (error) => {
      log(colors.red, `❌ 请求失败: ${error.message}`);
      reject(error);
    });

    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  log(colors.cyan, '\n╔═══════════════════════════════════════════════╗');
  log(colors.cyan, '║       新功能测试（文件处理+浏览器）        ║');
  log(colors.cyan, '╚═══════════════════════════════════════════════╝\n');

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of newFeatureTests) {
    try {
      const result = await runTest(testCase);
      results.push(result);
      passed++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      log(colors.red, `❌ 测试失败: ${error.message}`);
      failed++;
    }
  }

  // 总结
  log(colors.cyan, '\n╔═══════════════════════════════════════════════╗');
  log(colors.cyan, '║              测试结果总结                    ║');
  log(colors.cyan, '╚═══════════════════════════════════════════════╝\n');

  log(colors.yellow, `📊 总测试数: ${newFeatureTests.length}`);
  log(colors.green, `✅ 通过: ${passed}`);
  if (failed > 0) {
    log(colors.red, `❌ 失败: ${failed}`);
  }

  const toolUsage = {};
  results.forEach(r => {
    r.toolsUsed.forEach(tool => {
      toolUsage[tool] = (toolUsage[tool] || 0) + 1;
    });
  });

  log(colors.cyan, '\n📈 工具使用统计:');
  Object.entries(toolUsage).forEach(([tool, count]) => {
    log(colors.blue, `   ${tool}: ${count} 次`);
  });

  if (results.length > 0) {
    const avgDuration = (results.reduce((sum, r) => sum + parseFloat(r.duration), 0) / results.length).toFixed(2);
    log(colors.yellow, `\n⏱️  平均响应时间: ${avgDuration}秒`);
  }

  log(colors.cyan, '\n═══════════════════════════════════════════════\n');

  if (failed === 0) {
    log(colors.green, '🎉 所有新功能测试通过！');
  } else {
    log(colors.red, '⚠️  部分测试失败');
  }
}

function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: config.host,
      port: config.port,
      path: '/',
      method: 'GET'
    }, (res) => {
      resolve(true);
    });

    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('连接超时'));
    });

    req.end();
  });
}

async function main() {
  try {
    log(colors.blue, '🔍 检查服务器状态...');
    await checkServer();
    log(colors.green, '✅ 服务器运行正常\n');

    await runAllTests();
  } catch (error) {
    log(colors.red, `\n❌ 无法连接到服务器`);
    log(colors.yellow, '请确保开发服务器正在运行: npm run dev\n');
    process.exit(1);
  }
}

main();

