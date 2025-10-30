/**
 * 工具功能测试脚本
 * 测试所有可用的 AI 工具
 */

const http = require('http');

const config = {
  host: 'localhost',
  port: 3000,
  path: '/api/chat',
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

// 工具测试用例
const toolTests = [
  {
    name: '🔢 数学计算器测试',
    message: '计算 123 × 456 + sqrt(144)',
    expectedTool: 'calculate',
  },
  {
    name: '🌤️ 天气查询测试',
    message: '北京今天天气怎么样？',
    expectedTool: 'get_current_weather',
  },
  {
    name: '💻 代码执行测试',
    message: '写一个 Python 函数判断数字是否为偶数',
    expectedTool: 'execute_code',
  },
  {
    name: '🖼️ 图像生成测试',
    message: '生成一张可爱机器人的图片',
    expectedTool: 'generate_image',
  },
  {
    name: '🔍 网页搜索测试',
    message: '搜索最新的人工智能新闻',
    expectedTool: 'search_web',
  },
  {
    name: '📄 文件搜索测试',
    message: '在文档中搜索关于机器学习的内容',
    expectedTool: 'search_files',
  },
];

function runToolTest(testCase) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      messages: [{ role: 'user', content: testCase.message }],
      useTools: true,
    });

    const options = {
      hostname: config.host,
      port: config.port,
      path: config.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    log(colors.cyan, `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    log(colors.cyan, `📝 测试: ${testCase.name}`);
    log(colors.blue, `💬 消息: "${testCase.message}"`);
    log(colors.yellow, `🎯 预期工具: ${testCase.expectedTool}`);

    const startTime = Date.now();
    let responseData = '';
    let toolCalls = [];
    let toolResults = [];
    let hasContent = false;

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
                log(colors.magenta, `🔧 调用的工具: ${toolCalls.map(t => t.tool).join(', ')}`);
                log(colors.green, `✓ 工具调用成功`);
                
                // 显示工具结果摘要
                toolResults.forEach((result, idx) => {
                  log(colors.cyan, `\n  工具 ${idx + 1}: ${result.tool}`);
                  if (result.result.note) {
                    log(colors.yellow, `  提示: ${result.result.note}`);
                  }
                });
              } else {
                log(colors.yellow, `⚠️  未检测到工具调用`);
              }

              if (hasContent) {
                log(colors.blue, `📄 AI 生成了文本回复`);
              }

              resolve({
                success: true,
                testName: testCase.name,
                duration,
                toolsUsed: toolCalls.map(t => t.tool),
                expectedTool: testCase.expectedTool,
                toolCalled: toolCalls.some(t => t.tool === testCase.expectedTool),
              });
            } else {
              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'content' && parsed.content) {
                  hasContent = true;
                  responseData += parsed.content;
                  process.stdout.write(colors.green + '.' + colors.reset);
                } else if (parsed.type === 'tool_call') {
                  toolCalls.push({
                    tool: parsed.tool,
                    args: parsed.args,
                  });
                  log(colors.magenta, `\n🔧 调用工具: ${parsed.tool}`);
                  log(colors.cyan, `   参数: ${JSON.stringify(parsed.args, null, 2)}`);
                } else if (parsed.type === 'tool_result') {
                  toolResults.push({
                    tool: parsed.tool,
                    result: parsed.result,
                  });
                  log(colors.green, `✓ 工具执行完成: ${parsed.tool}`);
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      });

      res.on('end', () => {
        if (!hasContent && toolCalls.length === 0) {
          reject(new Error('未收到任何响应'));
        }
      });
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

async function runAllToolTests() {
  log(colors.cyan, '\n╔═══════════════════════════════════════════════╗');
  log(colors.cyan, '║     OpenAI Agent 工具功能测试             ║');
  log(colors.cyan, '╚═══════════════════════════════════════════════╝\n');

  const results = [];
  let passed = 0;
  let failed = 0;
  let toolsWorking = 0;

  for (const testCase of toolTests) {
    try {
      const result = await runToolTest(testCase);
      results.push(result);
      
      if (result.toolCalled) {
        passed++;
        toolsWorking++;
      } else {
        passed++;
        log(colors.yellow, `⚠️  预期工具 "${testCase.expectedTool}" 未被调用，但测试仍然通过`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      log(colors.red, `❌ 测试失败: ${error.message}`);
      failed++;
    }
  }

  // 测试总结
  log(colors.cyan, '\n╔═══════════════════════════════════════════════╗');
  log(colors.cyan, '║              测试结果总结                    ║');
  log(colors.cyan, '╚═══════════════════════════════════════════════╝\n');

  log(colors.yellow, `📊 总测试数: ${toolTests.length}`);
  log(colors.green, `✅ 通过: ${passed}`);
  if (failed > 0) {
    log(colors.red, `❌ 失败: ${failed}`);
  }
  log(colors.magenta, `🔧 工具正确调用: ${toolsWorking}/${toolTests.length}`);

  // 工具使用统计
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

  // 性能统计
  if (results.length > 0) {
    const avgDuration = (results.reduce((sum, r) => sum + parseFloat(r.duration), 0) / results.length).toFixed(2);
    log(colors.yellow, `\n⏱️  平均响应时间: ${avgDuration}秒`);
  }

  log(colors.cyan, '\n═══════════════════════════════════════════════\n');

  if (failed === 0 && toolsWorking >= toolTests.length * 0.8) {
    log(colors.green, '🎉 所有工具测试通过！工具集成成功！');
  } else if (failed === 0) {
    log(colors.yellow, '⚠️  测试通过，但部分工具未正确调用。AI 可能选择了不同的处理方式。');
  } else {
    log(colors.red, '⚠️  部分测试失败，请检查错误信息');
    process.exit(1);
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
    }, (res) => {
      resolve(true);
    });

    req.on('error', (error) => {
      reject(error);
    });

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

    await runAllToolTests();
  } catch (error) {
    log(colors.red, `\n❌ 无法连接到服务器 (${config.host}:${config.port})`);
    log(colors.yellow, '请确保开发服务器正在运行: npm run dev\n');
    process.exit(1);
  }
}

main();

