const express = require('express');
const router = express.Router();
const feishu = require('../utils/feishu');

const APP_TOKEN = process.env.BITABLE_APP_TOKEN;
const STORE_TABLE_ID = 'tblWeCC6wVxNFv3p'; // 门店表ID

// 获取所有门店
router.get('/', async (req, res) => {
  try {
    const { zone, pageSize = 100, pageToken } = req.query;
    
    const params = { pageSize: parseInt(pageSize) };
    if (pageToken) params.pageToken = pageToken;
    
    // 如果有区域筛选
    if (zone) {
      params.filter = {
        conjunction: 'and',
        conditions: [{
          field_name: '所属Zone',
          operator: 'is',
          value: [zone]
        }]
      };
    }

    const data = await feishu.listBitableRecords(APP_TOKEN, STORE_TABLE_ID, params);
    
    const stores = data.items?.map(item => ({
      recordId: item.record_id,
      storeId: item.fields['门店ID'],
      name: item.fields['门店名称'],
      storeNo: item.fields['店号'],
      zone: item.fields['所属Zone'],
      address: item.fields['地址'],
      phone: item.fields['电话'],
      fax: item.fields['传真'],
      createdTime: item.fields['创建时间'],
      modifiedTime: item.fields['修改时间']
    })) || [];

    res.json({
      success: true,
      data: stores,
      total: data.total || stores.length,
      hasMore: data.has_more,
      pageToken: data.page_token
    });
  } catch (error) {
    console.error('获取门店列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取单个门店
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await feishu.listBitableRecords(APP_TOKEN, STORE_TABLE_ID, {
      filter: {
        conjunction: 'and',
        conditions: [{
          field_name: '门店ID',
          operator: 'is',
          value: [id]
        }]
      }
    });

    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ success: false, message: '门店不存在' });
    }

    const item = data.items[0];
    const store = {
      recordId: item.record_id,
      storeId: item.fields['门店ID'],
      name: item.fields['门店名称'],
      storeNo: item.fields['店号'],
      zone: item.fields['所属Zone'],
      address: item.fields['地址'],
      phone: item.fields['电话'],
      fax: item.fields['传真']
    };

    res.json({ success: true, data: store });
  } catch (error) {
    console.error('获取门店详情失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建门店
router.post('/', async (req, res) => {
  try {
    const { storeId, name, storeNo, zone, address, phone, fax } = req.body;
    
    if (!storeId || !name) {
      return res.status(400).json({ success: false, message: '门店ID和名称不能为空' });
    }

    const fields = {
      '门店ID': storeId,
      '门店名称': name,
      '店号': storeNo || '',
      '所属Zone': zone || '',
      '地址': address || '',
      '电话': phone || '',
      '传真': fax || ''
    };

    const data = await feishu.createBitableRecord(APP_TOKEN, STORE_TABLE_ID, fields);
    
    res.json({
      success: true,
      message: '门店创建成功',
      data: { recordId: data.record.record_id }
    });
  } catch (error) {
    console.error('创建门店失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新门店
router.put('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { name, storeNo, zone, address, phone, fax } = req.body;

    const fields = {};
    if (name !== undefined) fields['门店名称'] = name;
    if (storeNo !== undefined) fields['店号'] = storeNo;
    if (zone !== undefined) fields['所属Zone'] = zone;
    if (address !== undefined) fields['地址'] = address;
    if (phone !== undefined) fields['电话'] = phone;
    if (fax !== undefined) fields['传真'] = fax;

    await feishu.updateBitableRecord(APP_TOKEN, STORE_TABLE_ID, recordId, fields);
    
    res.json({ success: true, message: '门店更新成功' });
  } catch (error) {
    console.error('更新门店失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除门店
router.delete('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    await feishu.deleteBitableRecord(APP_TOKEN, STORE_TABLE_ID, recordId);
    res.json({ success: true, message: '门店删除成功' });
  } catch (error) {
    console.error('删除门店失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取区域列表
router.get('/meta/zones', async (req, res) => {
  try {
    const data = await feishu.listBitableRecords(APP_TOKEN, STORE_TABLE_ID, { pageSize: 500 });
    
    const zones = [...new Set(data.items?.map(item => item.fields['所属Zone']).filter(Boolean))];
    
    res.json({ success: true, data: zones });
  } catch (error) {
    console.error('获取区域列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
