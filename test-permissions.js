const axios = require('axios');

const FEISHU_APP_ID = 'cli_a9629e691539dcb5';
const FEISHU_APP_SECRET = 'S9AtARbnyxanV1xakEztjcPRDxZXqq3w';
const BITABLE_TOKEN = 'IRfubNkAfaDLrws6xG6ccLtXncd';
const STORE_TABLE_ID = 'tblWeCC6wVxNFv3p';

async function testPermissions() {
  try {
    // 获取 access token
    const tokenRes = await axios.post('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET
    });
    
    const accessToken = tokenRes.data.app_access_token;
    
    console.log('=== 测试各种权限 ===\n');
    
    // 1. 测试读取表格列表
    console.log('1. 测试读取表格列表...');
    try {
      const tablesRes = await axios.get(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log('✅ 读取表格列表: 成功\n');
    } catch (e) {
      console.log('❌ 读取表格列表: 失败 -', e.response?.data?.msg || e.message, '\n');
    }
    
    // 2. 测试读取记录
    console.log('2. 测试读取记录...');
    try {
      const recordsRes = await axios.get(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/${STORE_TABLE_ID}/records?page_size=1`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log('✅ 读取记录: 成功\n');
    } catch (e) {
      console.log('❌ 读取记录: 失败 -', e.response?.data?.msg || e.message, '\n');
    }
    
    // 3. 测试创建记录
    console.log('3. 测试创建记录...');
    try {
      const createRes = await axios.post(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/${STORE_TABLE_ID}/records`,
        { fields: { '门店ID': 'TEST001', '门店名称': '测试门店' } },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      console.log('✅ 创建记录: 成功\n');
    } catch (e) {
      console.log('❌ 创建记录: 失败 -', e.response?.data?.msg || e.message, '\n');
    }
    
    // 4. 测试发送邮件
    console.log('4. 测试发送邮件...');
    try {
      const mailRes = await axios.post(
        'https://open.feishu.cn/open-apis/mail/v1/messages',
        {
          user_id: 'ou_6feca4fc1bce3a9750459c8f24addd47',
          subject: '测试邮件',
          content: '测试内容',
          content_type: 'text/plain'
        },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      console.log('✅ 发送邮件: 成功\n');
    } catch (e) {
      console.log('❌ 发送邮件: 失败 -', e.response?.data?.msg || e.message, '\n');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPermissions();
