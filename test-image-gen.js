#!/usr/bin/env node

/**
 * 测试图片生成功能
 */

async function testImageGeneration() {
  console.log('🎨 测试 DALL-E 3 图片生成功能\n');
  console.log('=' .repeat(50));
  
  const testCases = [
    {
      name: '测试 1：基础图片生成',
      prompt: '一只可爱的橘猫在阳光下打盹，水彩画风格',
      size: '1024x1024'
    },
    {
      name: '测试 2：横版图片',
      prompt: '未来主义城市夜景，霓虹灯，赛博朋克风格',
      size: '1792x1024'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`   描述: ${testCase.prompt}`);
    console.log(`   尺寸: ${testCase.size}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/tools/image-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testCase.prompt,
          size: testCase.size
        })
      });
      
      const data = await response.json();
      
      if (data.ok && data.image_url) {
        console.log('   ✅ 成功');
        console.log(`   🖼️  图片链接: ${data.image_url}`);
        if (data.revised_prompt) {
          console.log(`   📝 优化后提示: ${data.revised_prompt.substring(0, 100)}...`);
        }
        passed++;
      } else {
        console.log('   ❌ 失败');
        console.log(`   错误: ${data.error || '未知错误'}`);
        if (data.message) {
          console.log(`   详情: ${data.message}`);
        }
        failed++;
      }
    } catch (error) {
      console.log('   ❌ 请求失败');
      console.log(`   错误: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败\n`);
  
  if (failed > 0) {
    console.log('💡 提示：');
    console.log('   1. 确保 .env.local 中配置了 OPENAI_API_KEY');
    console.log('   2. 确保 API Key 有 DALL-E 访问权限');
    console.log('   3. 确保开发服务器正在运行 (npm run dev)');
    console.log('');
  }
}

// 运行测试
testImageGeneration().catch(console.error);

