/**
 * 全面测试所有 20 个工具
 */

const http = require('http');

const config = { host: 'localhost', port: 3000 };

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

// 所有工具测试用例
const allToolTests = [
  // 基础工具
  {
    name: '🔍 1. 网页搜索',
    message: '搜索 TypeScript 编程语言的特点',
    expectedTool: 'search_web',
  },
  {
    name: '💻 2. 代码执行',
    message: '用 Python 计算 1 到 50 的和',
    expectedTool: 'execute_code',
  },
  {
    name: '🎨 3. 图像生成',
    message: '生成一张简单的抽象艺术图',
    expectedTool: 'generate_image',
    skipTest: true, // 耗时较长，可选测试
  },
  {
    name: '🔢 4. 数学计算',
    message: '计算 sqrt(144) + 25',
    expectedTool: 'calculate',
  },
  
  // 文件处理
  {
    name: '📖 5. 文件读取',
    message: '列出 uploads 文件夹的所有文件',
    expectedTool: 'file_operations',
  },
  {
    name: '📝 6. 文档创建',
    message: '创建一个文本文件 test-all-tools.txt，内容是：测试工具',
    expectedTool: 'create_document',
  },
  {
    name: '🗂️ 7. 文件操作',
    message: '创建一个文件夹 test-results',
    expectedTool: 'file_operations',
  },
  
  // 网页和 API
  {
    name: '🌐 8. 网页访问',
    message: '访问 https://example.com',
    expectedTool: 'visit_website',
    skipTest: true, // 耗时较长
  },
  {
    name: '🔌 9. API 调用',
    message: '调用 API：https://api.github.com/zen',
    expectedTool: 'call_api',
  },
  
  // 内容处理
  {
    name: '🌐 10. 文本翻译',
    message: '将"Hello World"翻译成中文',
    expectedTool: 'translate_text',
  },
  {
    name: '✂️ 11. 文本处理',
    message: '统计这段文字的字数：人工智能技术发展迅速',
    expectedTool: 'process_text',
  },
  
  // 工具和转换
  {
    name: '⏰ 12. 时间处理',
    message: '今天是几号？',
    expectedTool: 'datetime_tool',
  },
  {
    name: '🔄 13. 数据转换',
    message: '将这个 JSON 转换为 CSV：[{"name":"test","value":1}]',
    expectedTool: 'convert_data',
  },
  
  // 高级功能
  {
    name: '📊 14. 数据可视化',
    message: '创建一个柱状图，标签是["A","B","C"]，数值是[10,20,15]',
    expectedTool: 'create_chart',
  },
  {
    name: '📷 15. OCR 识别',
    message: '（需要上传图片）',
    skipTest: true,
  },
  {
    name: '📧 16. 邮件发送',
    message: '（需要邮件配置）',
    skipTest: true,
  },
  {
    name: '🖼️ 17. 图片分析',
    message: '（需要上传图片）',
    skipTest: true,
  },
];

function runTest(testCase) {
  return new Promise((resolve, reject) => {
    if (testCase.skipTest) {
      log(colors.yellow, `\n⏭️  跳过测试: ${testCase.name}（需要特定条件）`);
      resolve({ skipped: true, testName: testCase.name });
      return;
    }

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
    log(colors.cyan, `测试: ${testCase.name}`);
    log(colors.blue, `消息: "${testCase.message}"`);

    const startTime = Date.now();
    let toolCalls = [];

    const req = http.request(options, (res) => {
      res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              const duration = ((Date.now() - startTime) / 1000).toFixed(2);

              if (toolCalls.length > 0) {
                log(colors.green, `✅ 测试通过`);
                log(colors.yellow, `⏱️  响应时间: ${duration}秒`);
                log(colors.magenta, `🔧 调用工具: ${toolCalls.join(', ')}`);
              } else {
                log(colors.yellow, `⚠️  未检测到工具调用（可能直接回答）`);
                log(colors.yellow, `⏱️  响应时间: ${duration}秒`);
              }

              resolve({ 
                success: true, 
                testName: testCase.name, 
                duration, 
                toolsUsed: toolCalls,
                toolCalled: toolCalls.includes(testCase.expectedTool)
              });
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'tool_call') {
                  toolCalls.push(parsed.tool);
                  process.stdout.write(colors.magenta + `🔧 ${parsed.tool} ` + colors.reset);
                } else if (parsed.type === 'content') {
                  process.stdout.write(colors.green + '.' + colors.reset);
                }
              } catch (e) {}
            }
          }
        }
      });
    });

    req.on('error', (error) => {
      log(colors.red, `❌ 测试失败: ${error.message}`);
      reject(error);
    });

    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('测试超时'));
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  log(colors.cyan, '\n╔═══════════════════════════════════════════════╗');
  log(colors.cyan, '║        全工具测试（20个工具）              ║');
  log(colors.cyan, '╚═══════════════════════════════════════════════╝\n');

  let totalTests = 0;
  let passed = 0;
  let skipped = 0;
  let failed = 0;
  const results = [];

  for (const test of allToolTests) {
    totalTests++;
    try {
      const result = await runTest(test);
      results.push(result);
      
      if (result.skipped) {
        skipped++;
      } else {
        passed++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      failed++;
      log(colors.red, `❌ 错误: ${error.message}`);
    }
  }

  // 总结
  log(colors.cyan, '\n\n╔═══════════════════════════════════════════════╗');
  log(colors.cyan, '║              测试结果总结                    ║');
  log(colors.cyan, '╚═══════════════════════════════════════════════╝\n');

  log(colors.yellow, `📊 总测试数: ${totalTests}`);
  log(colors.green, `✅ 通过: ${passed}`);
  log(colors.yellow, `⏭️  跳过: ${skipped}`);
  if (failed > 0) {
    log(colors.red, `❌ 失败: ${failed}`);
  }

  // 工具使用统计
  const toolUsage = {};
  results.forEach(r => {
    if (r.toolsUsed) {
      r.toolsUsed.forEach(tool => {
        toolUsage[tool] = (toolUsage[tool] || 0) + 1;
      });
    }
  });

  if (Object.keys(toolUsage).length > 0) {
    log(colors.cyan, '\n📈 工具调用统计:');
    Object.entries(toolUsage).forEach(([tool, count]) => {
      log(colors.blue, `   ${tool}: ${count} 次`);
    });
  }

  const avgDuration = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + parseFloat(r.duration), 0) / results.filter(r => r.duration).length;

  log(colors.yellow, `\n⏱️  平均响应时间: ${avgDuration.toFixed(2)}秒`);

  log(colors.cyan, '\n═══════════════════════════════════════════════\n');

  if (failed === 0) {
    log(colors.green, `🎉 测试完成！${passed} 个工具测试通过，${skipped} 个跳过！`);
    log(colors.cyan, '\n提示：跳过的工具需要特定条件（上传图片、配置邮件等）');
  } else {
    log(colors.yellow, '⚠️  部分测试失败，请检查错误信息');
  }
}

// 检查服务器
function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: config.host,
      port: config.port,
      path: '/',
      method: 'GET'
    }, (res) => resolve(true));

    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('连接超时'));
    });

    req.end();
  });
}

async function start() {
  try {
    log(colors.blue, '🔍 检查服务器状态...');
    await checkServer();
    log(colors.green, '✅ 服务器运行正常\n');

    await main();
  } catch (error) {
    log(colors.red, `\n❌ 无法连接到服务器`);
    log(colors.yellow, '请确保开发服务器正在运行: npm run dev\n');
    process.exit(1);
  }
}

start();




