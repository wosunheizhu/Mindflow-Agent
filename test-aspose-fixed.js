/**
 * 修复版 Aspose API 测试
 */

const axios = require('axios');
const fs = require('fs');

async function testAsposePPT() {
  console.log('🧪 测试 Aspose Cloud API...\n');

  const clientId = '43287341-617f-4d95-9caa-b166d46fbb8d';
  const clientSecret = '1c0df04fbde71bcfbc75cbe6f3d297bf';

  try {
    // 1. 获取 Access Token
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
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Token 获取成功\n');

    // 2. 使用 CreatePresentation 端点（带 isImageDataEmbedded 参数）
    console.log('📝 步骤 2: 创建新演示文稿...');
    const pptxName = 'test_presentation.pptx';
    
    // 使用 PUT 方法创建新的演示文稿
    const createResponse = await axios.put(
      `https://api.aspose.cloud/v3.0/slides/${pptxName}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          password: ''
        },
        timeout: 30000,
      }
    );

    console.log('✅ 演示文稿创建成功:', pptxName);
    console.log('   幻灯片数:', createResponse.data.slides?.slideList?.length || 0, '\n');

    // 3. 在第一张幻灯片添加文本
    console.log('📝 步骤 3: 添加文本内容...');
    
    const shapeResponse = await axios.post(
      `https://api.aspose.cloud/v3.0/slides/${pptxName}/slides/1/shapes`,
      {
        shapeType: 'Rectangle',
        x: 50,
        y: 100,
        width: 600,
        height: 200,
        text: '🎉 Aspose PPT 测试成功！\n\n这是自动生成的演示文稿\n功能正常工作'
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ 文本框已添加\n');

    // 4. 下载文件
    console.log('📝 步骤 4: 下载生成的 PPTX...');
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

    // 保存文件
    if (!fs.existsSync('./outputs')) {
      fs.mkdirSync('./outputs', { recursive: true });
    }
    
    const outputPath = `./outputs/${pptxName}`;
    fs.writeFileSync(outputPath, downloadResponse.data);
    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
    
    console.log('✅ 文件已保存');
    console.log('   路径:', outputPath);
    console.log('   大小:', fileSize, 'KB\n');

    // 5. 清理：删除云端文件
    console.log('📝 步骤 5: 清理云端文件...');
    await axios.delete(
      `https://api.aspose.cloud/v3.0/slides/storage/file/${pptxName}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    console.log('✅ 云端文件已删除\n');

    // 总结
    console.log('='.repeat(60));
    console.log('🎉 所有测试通过！');
    console.log('='.repeat(60));
    console.log('✅ API 认证成功');
    console.log('✅ 创建演示文稿成功');
    console.log('✅ 添加内容成功');
    console.log('✅ 下载文件成功');
    console.log('✅ 清理文件成功');
    console.log('\n📁 生成的文件:', outputPath);
    console.log('🔗 打开文件查看测试结果\n');

    return true;

  } catch (error) {
    console.error('\n❌ 测试失败!');
    console.error('错误:', error.message);
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

// 运行测试
console.log('='.repeat(60));
console.log('Aspose PPT 生成功能测试');
console.log('='.repeat(60));
console.log('\n');

testAsposePPT().then(success => {
  if (success) {
    console.log('✅ 测试成功！PPT 生成功能可以正常使用。\n');
  } else {
    console.log('❌ 测试失败，请检查错误信息。\n');
  }
  process.exit(success ? 0 : 1);
});
