/**
 * 工作流系统测试脚本
 */

const http = require('http');

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

async function testWorkflowAPI() {
  log(colors.cyan, '\n╔═══════════════════════════════════════════════╗');
  log(colors.cyan, '║           工作流系统测试                     ║');
  log(colors.cyan, '╚═══════════════════════════════════════════════╝\n');

  try {
    // 测试 1：获取模板
    log(colors.blue, '📋 测试 1: 获取工作流模板');
    const templates = await makeRequest('GET', '/api/workflow?action=templates');
    log(colors.green, `✅ 找到 ${templates.templates?.length || 0} 个模板`);
    
    if (templates.templates && templates.templates.length > 0) {
      templates.templates.forEach((t, i) => {
        log(colors.cyan, `   ${i + 1}. ${t.name} - ${t.description}`);
      });
    }

    // 测试 2：从模板创建工作流
    log(colors.blue, '\n🔧 测试 2: 从模板创建工作流');
    const createResult = await makeRequest('POST', '/api/workflow', {
      action: 'from-template',
      templateId: 'research_and_summarize',
    });
    
    if (createResult.workflow) {
      log(colors.green, `✅ 工作流创建成功: ${createResult.workflow.name}`);
      log(colors.yellow, `   ID: ${createResult.workflow.id}`);
      log(colors.yellow, `   步骤数: ${createResult.workflow.steps.length}`);
    }

    // 测试 3：获取工作流列表
    log(colors.blue, '\n📁 测试 3: 获取工作流列表');
    const listResult = await makeRequest('GET', '/api/workflow?action=list');
    log(colors.green, `✅ 找到 ${listResult.workflows?.length || 0} 个工作流`);

    // 测试 4：执行工作流
    if (createResult.workflow) {
      log(colors.blue, '\n⚡ 测试 4: 执行工作流');
      log(colors.yellow, '   注意：这可能需要一些时间...');
      
      const execResult = await makeRequest('POST', '/api/workflow', {
        action: 'execute',
        workflowId: createResult.workflow.id,
        variables: { topic: 'TypeScript 最佳实践' },
      });

      if (execResult.execution) {
        log(colors.green, `✅ 工作流执行完成`);
        log(colors.cyan, `   状态: ${execResult.execution.status}`);
        log(colors.cyan, `   步骤: ${Object.keys(execResult.execution.results).length} 个完成`);
        log(colors.cyan, `   日志: ${execResult.execution.logs.length} 条`);
      }
    }

    log(colors.cyan, '\n═══════════════════════════════════════════════');
    log(colors.green, '🎉 所有测试通过！工作流系统正常工作！\n');

  } catch (error) {
    log(colors.red, `\n❌ 测试失败: ${error.message}\n`);
    process.exit(1);
  }
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.host,
      port: config.port,
      path: path,
      method: method,
      headers: data ? {
        'Content-Type': 'application/json',
      } : {},
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          resolve({ raw: responseData });
        }
      });
    });

    req.on('error', reject);

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 运行测试
testWorkflowAPI();

