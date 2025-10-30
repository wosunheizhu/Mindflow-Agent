/**
 * 简单测试 Aspose API 连接
 */

const axios = require('axios');

async function testAsposeConnection() {
  console.log('🧪 测试 Aspose Cloud API 连接...\n');

  const clientId = '43287341-617f-4d95-9caa-b166d46fbb8d';
  const clientSecret = '1c0df04fbde71bcfbc75cbe6f3d297bf';

  try {
    // 1. 测试获取 Access Token
    console.log('📝 步骤 1: 获取 Access Token...');
    const tokenResponse = await axios.post(
      'https://api.aspose.cloud/connect/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Token 获取成功');
    console.log('   Token 前 20 个字符:', accessToken.substring(0, 20) + '...');
    console.log('   过期时间:', tokenResponse.data.expires_in, '秒\n');

    // 2. 测试创建演示文稿
    console.log('📝 步骤 2: 创建测试演示文稿...');
    const pptxName = 'test_' + Date.now() + '.pptx';
    
    const createResponse = await axios.post(
      `https://api.aspose.cloud/v3.0/slides/${pptxName}`,
      null,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ 演示文稿创建成功:', pptxName);
    console.log('   状态码:', createResponse.status);
    console.log('   文档 URI:', createResponse.data.selfUri?.href || 'N/A');
    console.log('   默认幻灯片数:', createResponse.data.slides?.slideList?.length || 0, '张\n');

    // 3. 测试添加幻灯片
    console.log('📝 步骤 3: 添加内容幻灯片...');
    
    // 删除默认幻灯片
    await axios.delete(
      `https://api.aspose.cloud/v3.0/slides/${pptxName}/slides/1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    console.log('✅ 默认幻灯片已删除');

    // 添加新幻灯片
    await axios.post(
      `https://api.aspose.cloud/v3.0/slides/${pptxName}/slides`,
      { layoutSlide: { type: 'Title' } },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ 新幻灯片已添加\n');

    // 4. 测试添加文本框
    console.log('📝 步骤 4: 添加文本内容...');
    await axios.post(
      `https://api.aspose.cloud/v3.0/slides/${pptxName}/slides/1/shapes`,
      {
        shapeType: 'Rectangle',
        x: 100,
        y: 100,
        width: 500,
        height: 200,
        text: '🎉 测试成功！\n\nAspose PPT 生成功能正常工作',
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ 文本框已添加\n');

    // 5. 测试下载
    console.log('📝 步骤 5: 下载生成的 PPTX...');
    const downloadResponse = await axios.get(
      `https://api.aspose.cloud/v3.0/slides/${pptxName}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    );

    const fs = require('fs');
    const outputPath = `./outputs/${pptxName}`;
    
    // 确保 outputs 目录存在
    if (!fs.existsSync('./outputs')) {
      fs.mkdirSync('./outputs', { recursive: true });
    }
    
    fs.writeFileSync(outputPath, downloadResponse.data);
    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
    
    console.log('✅ 文件已保存');
    console.log('   路径:', outputPath);
    console.log('   大小:', fileSize, 'KB\n');

    // 总结
    console.log('='.repeat(60));
    console.log('🎉 所有测试通过！');
    console.log('='.repeat(60));
    console.log('✅ API 连接正常');
    console.log('✅ Token 获取正常');
    console.log('✅ 创建演示文稿正常');
    console.log('✅ 添加幻灯片正常');
    console.log('✅ 添加内容正常');
    console.log('✅ 文件下载正常');
    console.log('\n📁 生成的文件:', outputPath);
    console.log('🔗 你可以打开这个文件查看测试结果\n');

    return true;

  } catch (error) {
    console.error('\n❌ 测试失败!');
    console.error('错误信息:', error.message);
    
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 提示: 无法连接到 Aspose API，请检查网络连接');
    } else if (error.response?.status === 401) {
      console.error('\n💡 提示: 认证失败，请检查 Client ID 和 Secret');
    } else if (error.response?.status === 429) {
      console.error('\n💡 提示: API 调用次数超过限制');
    }
    
    return false;
  }
}

// 运行测试
console.log('='.repeat(60));
console.log('Aspose.Slides Cloud API 功能测试');
console.log('='.repeat(60));
console.log('\n');

testAsposeConnection().then(success => {
  process.exit(success ? 0 : 1);
});
