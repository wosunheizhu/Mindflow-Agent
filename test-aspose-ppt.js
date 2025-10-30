/**
 * Aspose PPT 生成测试脚本
 * 测试 create_presentation 工具是否正常工作
 */

const axios = require('axios');

async function testAsposePPT() {
  console.log('🧪 测试 Aspose PPT 生成功能...\n');

  try {
    // 测试数据
    const testData = {
      messages: [
        {
          role: 'user',
          content: '帮我创建一份测试 PPT，包含三页：简介、内容、总结'
        }
      ],
      useTools: true,
      deepThinking: false,
      browserSearch: false,
      avatarEnabled: false,
      modelProvider: 'claude'
    };

    console.log('📤 发送请求到 Agent API...');
    
    const response = await axios.post('http://localhost:3000/api/chat', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000,
      responseType: 'text'
    });

    console.log('✅ 请求成功！');
    console.log('\n📄 响应预览（前500字符）:');
    console.log(response.data.substring(0, 500));
    
    // 检查是否包含 PPT 生成相关信息
    if (response.data.includes('create_presentation') || 
        response.data.includes('.pptx') ||
        response.data.includes('演示文稿')) {
      console.log('\n✅ 检测到 PPT 生成相关内容！');
    } else {
      console.log('\n⚠️ 未检测到 PPT 生成相关内容');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data?.substring(0, 200));
    }
  }
}

// 简单测试：直接测试工具调用
async function testToolDirectly() {
  console.log('\n🧪 直接测试工具调用...\n');
  
  try {
    const { executeToolCall } = require('./lib/tools-complete.ts');
    
    const result = await executeToolCall('create_presentation', {
      filename: 'test_presentation',
      title: '测试演示文稿',
      slides: [
        {
          title: '第一页：简介',
          content: '这是测试 PPT 的第一页\n包含简介内容\n验证功能是否正常'
        },
        {
          title: '第二页：主要内容',
          content: '• 要点一\n• 要点二\n• 要点三'
        },
        {
          title: '第三页：总结',
          content: '测试总结\n所有功能正常'
        }
      ]
    });

    console.log('✅ 工具调用成功！');
    console.log('📊 结果:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`\n🎉 PPT 生成成功！`);
      console.log(`📁 文件路径: ${result.path}`);
      console.log(`🔗 下载链接: ${result.downloadUrl}`);
    } else {
      console.log('\n❌ PPT 生成失败');
      console.log('错误:', result.error || result.message);
    }

  } catch (error) {
    console.error('❌ 直接调用失败:', error.message);
  }
}

// 运行测试
console.log('='.repeat(60));
console.log('Aspose PPT 生成功能测试');
console.log('='.repeat(60) + '\n');

// 提示：选择测试方式
console.log('测试方式：');
console.log('1. testAsposePPT() - 通过 API 测试（需要 Next.js 服务运行）');
console.log('2. testToolDirectly() - 直接测试工具（推荐）\n');

// 执行直接测试
testToolDirectly();

