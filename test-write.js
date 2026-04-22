const axios = require('axios');

const FEISHU_APP_ID = 'cli_a9629e691539dcb5';
const FEISHU_APP_SECRET = 'S9AtARbnyxanV1xakEztjcPRDxZXqq3w';
const BITABLE_TOKEN = 'IRfubNkAfaDLrws6xG6ccLtXncd';
const STORE_TABLE_ID = 'tblWeCC6wVxNFv3p';

async function test() {
  try {
    // 获取 access token
    const tokenRes = await axios.post('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET
    });
    
    const accessToken = tokenRes.data.app_access_token;
    
    // 测试创建记录
    const createRes = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/${STORE_TABLE_ID}/records`,
      {
        fields: {
          '门店ID': 'STORE001',
          '门店名称': '测试门店',
          '店号': 'M0001',
          '所属Zone': '上海 Zone'
        }
      },
      {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Create Response:', JSON.stringify(createRes.data, null, 2));
    
  } catch (error) {
    console.error('Error:', JSON.stringify(error.response?.data, null, 2) || error.message);
  }
}

test();
