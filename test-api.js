const axios = require('axios');

const FEISHU_APP_ID = 'cli_a9629e691539dcb5';
const FEISHU_APP_SECRET = 'S9AtARbnyxanV1xakEztjcPRDxZXqq3w';
const BITABLE_TOKEN = 'IRfubNkAfaDLrws6xG6ccLtXncd';

async function test() {
  try {
    // 获取 access token
    const tokenRes = await axios.post('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET
    });
    
    console.log('Token Response:', JSON.stringify(tokenRes.data, null, 2));
    
    if (tokenRes.data.code !== 0) {
      console.error('获取 token 失败:', tokenRes.data.msg);
      return;
    }
    
    const accessToken = tokenRes.data.app_access_token;
    
    // 测试获取表格列表
    const tablesRes = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    
    console.log('Tables Response:', JSON.stringify(tablesRes.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
