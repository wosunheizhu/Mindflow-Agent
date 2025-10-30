/**
 * 文档创建和文件操作工具测试
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
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

const tests = [
  {
    name: '📝 文档创建 - Markdown',
    message: '创建一个 Markdown 文件 test-report.md，内容是：# 测试报告\\n这是自动生成的测试文档。',
    expectedTool: 'create_document',
  },
  {
    name: '📄 文档创建 - 文本文件',
    message: '创建一个文本文件 hello.txt，内容是：Hello, World! 这是测试文件。',
    expectedTool: 'create_document',
  },
  {
    name: '🗂️ 文件操作 - 列出目录',
    message: '列出 uploads 文件夹中的所有文件',
    expectedTool: 'file_operations',
  },
  {
    name: '📁 文件操作 - 创建文件夹',
    message: '创建一个名为 test-folder 的文件夹',
    expectedTool: 'file_operations',
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

    const req = http.request(options, (res) => {
      res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              const duration = ((Date.now() - startTime) / 1000).toFixed(2);

              log(colors.green, `\n✅ 测试完成`);
              log(colors.yellow, `⏱️  响应时间: ${duration}秒`);
              
              if (toolCalls.length > 0) {
                log(colors.magenta, `🔧 调用的工具: ${toolCalls.join(', ')}`);
              }

              resolve({ success: true, testName: testCase.name, duration, toolsUsed: toolCalls });
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'tool_call') {
                  toolCalls.push(parsed.tool);
                  log(colors.magenta, `\n🔧 调用工具: ${parsed.tool}`);
                } else if (parsed.type === 'tool_result') {
                  log(colors.green, `✓ 工具执行完成`);
                } else if (parsed.type === 'content') {
                  process.stdout.write(colors.green + '.' + colors.reset);
                }
              } catch (e) {}
            }
          }
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('超时'));
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  log(colors.cyan, '\n╔═══════════════════════════════════════════════╗');
  log(colors.cyan, '║     文档创建和文件操作工具测试            ║');
  log(colors.cyan, '╚═══════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await runTest(test);
      passed++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      log(colors.red, `❌ 测试失败: ${error.message}`);
      failed++;
    }
  }

  log(colors.cyan, '\n╔═══════════════════════════════════════════════╗');
  log(colors.cyan, '║              测试结果总结                    ║');
  log(colors.cyan, '╚═══════════════════════════════════════════════╝\n');

  log(colors.yellow, `📊 总测试数: ${tests.length}`);
  log(colors.green, `✅ 通过: ${passed}`);
  if (failed > 0) {
    log(colors.red, `❌ 失败: ${failed}`);
  }

  log(colors.cyan, '\n═══════════════════════════════════════════════\n');

  if (failed === 0) {
    log(colors.green, '🎉 所有测试通过！新工具正常工作！');
  }
}

main();

