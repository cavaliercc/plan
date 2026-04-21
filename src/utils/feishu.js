const axios = require('axios');

const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

class FeishuClient {
  constructor() {
    this.appId = process.env.FEISHU_APP_ID;
    this.appSecret = process.env.FEISHU_APP_SECRET;
    this.accessToken = null;
    this.tokenExpireTime = 0;
  }

  // 获取访问令牌
  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`${FEISHU_API_BASE}/auth/v3/app_access_token/internal`, {
        app_id: this.appId,
        app_secret: this.appSecret
      });

      if (response.data.code === 0) {
        this.accessToken = response.data.app_access_token;
        this.tokenExpireTime = Date.now() + (response.data.expire - 60) * 1000;
        return this.accessToken;
      }
      throw new Error(response.data.msg || '获取访问令牌失败');
    } catch (error) {
      console.error('获取飞书访问令牌失败:', error.message);
      throw error;
    }
  }

  // 通用请求方法
  async request(method, url, data = null, params = null) {
    const token = await this.getAccessToken();
    const config = {
      method,
      url: `${FEISHU_API_BASE}${url}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) config.data = data;
    if (params) config.params = params;

    try {
      const response = await axios(config);
      if (response.data.code !== 0) {
        throw new Error(response.data.msg || '请求失败');
      }
      return response.data.data;
    } catch (error) {
      console.error(`飞书API请求失败 [${method}] ${url}:`, error.message);
      throw error;
    }
  }

  // 多维表格操作
  async listBitableRecords(appToken, tableId, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.pageSize) queryParams.append('page_size', params.pageSize);
    if (params.pageToken) queryParams.append('page_token', params.pageToken);
    if (params.filter) queryParams.append('filter', JSON.stringify(params.filter));
    if (params.sort) queryParams.append('sort', JSON.stringify(params.sort));
    if (params.fieldNames) queryParams.append('field_names', JSON.stringify(params.fieldNames));

    const queryString = queryParams.toString();
    const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records${queryString ? '?' + queryString : ''}`;
    
    return await this.request('GET', url);
  }

  async createBitableRecord(appToken, tableId, fields) {
    const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records`;
    return await this.request('POST', url, { fields });
  }

  async updateBitableRecord(appToken, tableId, recordId, fields) {
    const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`;
    return await this.request('PUT', url, { fields });
  }

  async deleteBitableRecord(appToken, tableId, recordId) {
    const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`;
    return await this.request('DELETE', url);
  }

  async batchCreateBitableRecords(appToken, tableId, records) {
    const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`;
    return await this.request('POST', url, { records });
  }

  // 发送邮件
  async sendEmail(userId, subject, content) {
    const url = '/mail/v1/messages';
    return await this.request('POST', url, {
      user_id: userId,
      subject,
      content,
      content_type: 'text/html'
    });
  }

  // 获取用户信息
  async getUserInfo(userId) {
    const url = `/contact/v3/users/${userId}`;
    return await this.request('GET', url);
  }

  // 搜索用户
  async searchUsers(query) {
    const url = '/contact/v3/users/search';
    return await this.request('GET', url, null, { query });
  }
}

module.exports = new FeishuClient();
