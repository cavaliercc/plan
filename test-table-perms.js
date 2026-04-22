const axios = require('axios');

const FEISHU_APP_ID = 'cli_a9629e691539dcb5';
const FEISHU_APP_SECRET = 'S9AtARbnyxanV1xakEztjcPRDxZXqq3w';
const BITABLE_TOKEN = 'IRfubNkAfaDLrws6xG6ccLtXncd';

async function test() {
  try {
    // 获取 tenant_access_token（需要租户权限）
    const tokenRes = await axios.post('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET
    });
    
    const accessToken = tokenRes.data.tenant_access_token || tokenRes.data.app_access_token;
    
    console.log('Token type:', tokenRes.data.tenant_access_token ? 'tenant' : 'app');
    console.log('Token:', accessToken.substring(0, 20) + '...\n');
    
    // 尝试使用 tenant_access_token 创建记录
    console.log('使用 tenant_access_token 测试创建记录...');
    try {
      const createRes = await axios.post(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/tblWeCC6wVxNFv3p/records`,
        { fields: { '门店ID': 'TEST001', '门店名称': '测试门店' } },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      console.log('✅ 成功:', JSON.stringify(createRes.data, null, 2));
    } catch (e) {
      console.log('❌ 失败:', e.response?.data?.msg || e.message);
      console.log('错误码:', e.response?.data?.code);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
