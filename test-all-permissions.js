const axios = require('axios');

const FEISHU_APP_ID = 'cli_a9629e691539dcb5';
const FEISHU_APP_SECRET = 'S9AtARbnyxanV1xakEztjcPRDxZXqq3w';
const BITABLE_TOKEN = 'IRfubNkAfaDLrws6xG6ccLtXncd';
const STORE_TABLE_ID = 'tblWeCC6wVxNFv3p';

async function testAll() {
  try {
    // 获取 access token
    const tokenRes = await axios.post('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET
    });
    
    const accessToken = tokenRes.data.app_access_token;
    console.log('✅ 获取 Token 成功\n');
    
    // 测试 1: 读取表格列表
    console.log('测试 1: 读取表格列表...');
    try {
      const res = await axios.get(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log('✅ 成功\n');
    } catch (e) {
      console.log('❌ 失败:', e.response?.data?.msg || e.message, '\n');
    }
    
    // 测试 2: 读取记录
    console.log('测试 2: 读取记录...');
    try {
      const res = await axios.get(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/${STORE_TABLE_ID}/records?page_size=1`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log('✅ 成功\n');
    } catch (e) {
      console.log('❌ 失败:', e.response?.data?.msg || e.message, '\n');
    }
    
    // 测试 3: 创建记录
    console.log('测试 3: 创建记录...');
    try {
      const res = await axios.post(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/${STORE_TABLE_ID}/records`,
        { fields: { '门店ID': 'TEST001', '门店名称': '测试门店' } },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      console.log('✅ 成功\n');
    } catch (e) {
      console.log('❌ 失败:', e.response?.data?.msg || e.message, '\n');
    }
    
    // 测试 4: 更新记录（先创建一个再更新）
    console.log('测试 4: 更新记录...');
    console.log('跳过（需要先创建记录）\n');
    
    // 测试 5: 删除记录
    console.log('测试 5: 删除记录...');
    console.log('跳过（需要先创建记录）\n');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAll();
