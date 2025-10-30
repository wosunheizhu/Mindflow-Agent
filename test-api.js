/**
 * API 功能自动化测试脚本
 * 运行: node test-api.js
 */

const http = require('http');

// 测试配置
const config = {
  host: 'localhost',
  port: 3000,
  path: '/api/chat',
};

// 测试用例
const testCases = [
  {
    name: '基础对话测试',
    messages: [{ role: 'user', content: '你好，请用一句话介绍你自己' }],
  },
  {
    name: '数学计算测试',
    messages: [{ role: 'user', content: '计算 123 + 456 = ?' }],
  },
  {
    name: '代码相关测试',
    messages: [
      { role: 'user', content: '写一个 JavaScript 函数判断数字是否为偶数' },
    ],
  },
  {
    name: '多轮对话测试',
    messages: [
      { role: 'user', content: '我想学习编程' },
      { role: 'assistant', content: '很好！你想学习哪种编程语言呢？' },
      { role: 'user', content: 'Python，应该从哪里开始？' },
    ],
  },
];

// 颜色输出
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

// 执行单个测试
function runTest(testCase) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ messages: testCase.messages });

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

    log(colors.cyan, `\n🧪 测试: ${testCase.name}`);
    log(colors.blue, `📤 发送消息: "${testCase.messages[testCase.messages.length - 1].content}"`);

    const startTime = Date.now();
    let responseData = '';
    let chunkCount = 0;

    const req = http.request(options, (res) => {
      res.on('data', (chunk) => {
        chunkCount++;
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              const endTime = Date.now();
              const duration = ((endTime - startTime) / 1000).toFixed(2);
              
              log(colors.green, `✅ 测试通过`);
              log(colors.yellow, `📊 响应时间: ${duration}秒`);
              log(colors.yellow, `📦 接收块数: ${chunkCount}`);
              log(colors.blue, `📥 完整响应:\n${responseData.substring(0, 200)}${responseData.length > 200 ? '...' : ''}`);
              
              resolve({
                success: true,
                testName: testCase.name,
                duration,
                chunkCount,
                responseLength: responseData.length,
              });
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  responseData += parsed.content;
                  process.stdout.write('.');
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      });

      res.on('end', () => {
        if (!responseData) {
          reject(new Error('未收到响应数据'));
        }
      });
    });

    req.on('error', (error) => {
      log(colors.red, `❌ 测试失败: ${error.message}`);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.write(postData);
    req.end();
  });
}

// 运行所有测试
async function runAllTests() {
  log(colors.cyan, '\n╔════════════════════════════════════════╗');
  log(colors.cyan, '║     OpenAI Agent API 功能测试        ║');
  log(colors.cyan, '╚════════════════════════════════════════╝\n');

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const result = await runTest(testCase);
      results.push(result);
      passed++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // 避免请求过快
    } catch (error) {
      log(colors.red, `❌ 错误: ${error.message}`);
      failed++;
    }
  }

  // 打印测试摘要
  log(colors.cyan, '\n╔════════════════════════════════════════╗');
  log(colors.cyan, '║           测试结果摘要                ║');
  log(colors.cyan, '╚════════════════════════════════════════╝\n');

  log(colors.yellow, `📊 总测试数: ${testCases.length}`);
  log(colors.green, `✅ 通过: ${passed}`);
  if (failed > 0) {
    log(colors.red, `❌ 失败: ${failed}`);
  }

  if (results.length > 0) {
    const avgDuration = (results.reduce((sum, r) => sum + parseFloat(r.duration), 0) / results.length).toFixed(2);
    const totalChunks = results.reduce((sum, r) => sum + r.chunkCount, 0);
    
    log(colors.yellow, `⏱️  平均响应时间: ${avgDuration}秒`);
    log(colors.yellow, `📦 总接收块数: ${totalChunks}`);
  }

  log(colors.cyan, '\n═══════════════════════════════════════════\n');

  if (failed === 0) {
    log(colors.green, '🎉 所有测试通过！');
  } else {
    log(colors.red, '⚠️  部分测试失败，请检查错误信息');
    process.exit(1);
  }
}

// 检查服务器是否运行
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

// 主函数
async function main() {
  try {
    log(colors.blue, '🔍 检查服务器状态...');
    await checkServer();
    log(colors.green, '✅ 服务器运行正常\n');
    
    await runAllTests();
  } catch (error) {
    log(colors.red, `\n❌ 无法连接到服务器 (${config.host}:${config.port})`);
    log(colors.yellow, '请确保开发服务器正在运行: npm run dev\n');
    process.exit(1);
  }
}

// 运行测试
main();

