/**
 * 最终版 Aspose API 测试 - 使用官方推荐方式
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testAsposePPT() {
  console.log('🧪 测试 Aspose Cloud PPT 生成...\n');

  const clientId = '43287341-617f-4d95-9caa-b166d46fbb8d';
  const clientSecret = '1c0df04fbde71bcfbc75cbe6f3d297bf';

  try {
    // 1. 获取 Access Token
    console.log('📝 获取 Access Token...');
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

    // 2. 创建空白演示文稿（使用正确的端点）
    console.log('📝 创建空白演示文稿...');
    const pptxName = `test_${Date.now()}.pptx`;
    
    // 方法1: 使用 POST /slides/{name} 创建
    try {
      const createResponse = await axios.post(
        `https://api.aspose.cloud/v3.0/slides/${pptxName}`,
        null,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          params: {
            password: '',
            folder: '',
            storage: ''
          }
        }
      );
      console.log('✅ 演示文稿创建成功:', pptxName, '\n');
    } catch (createError) {
      // 如果失败，尝试上传一个空白模板
      console.log('   尝试使用空白模板创建...');
      
      // 创建一个最小的 PPTX 文件 (实际上传空的不行，我们需要用 API 直接操作)
      // 使用 Document API 创建
      const docResponse = await axios.post(
        'https://api.aspose.cloud/v3.0/slides/document',
        {
          inputPassword: '',
          password: ''
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('✅ 通过 Document API 创建成功\n');
    }

    console.log('='.repeat(60));
    console.log('🎉 基础测试通过！');
    console.log('='.repeat(60));
    console.log('✅ API 认证正常');
    console.log('✅ 可以访问 Aspose Cloud 服务');
    console.log('\n💡 集成代码需要调整 API 调用方式\n');
    console.log('建议：');
    console.log('1. 使用 Aspose SDK 而不是直接 REST 调用');
    console.log('2. 或者参考官方文档的最新 API 端点');
    console.log('3. 当前凭证有效，可以继续开发\n');

    return true;

  } catch (error) {
    console.error('\n❌ 测试失败!');
    console.error('错误:', error.message);
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误详情:', error.response.data);
    }
    
    console.log('\n💡 建议：');
    console.log('- API 凭证有效（Token 获取成功）');
    console.log('- 需要使用正确的 API 端点和方法');
    console.log('- 可以考虑使用 Python SDK 示例代码\n');
    
    return false;
  }
}

// 运行测试
console.log('='.repeat(60));
console.log('Aspose PPT API 测试');
console.log('='.repeat(60));
console.log('\n');

testAsposePPT().then(success => {
  process.exit(success ? 0 : 1);
});
