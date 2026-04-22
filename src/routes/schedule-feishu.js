const express = require('express');
const router = express.Router();
const moment = require('moment');
const feishu = require('../utils/feishu');

const APP_TOKEN = process.env.BITABLE_APP_TOKEN;
const SCHEDULE_TABLE_ID = 'tblufg4Pfhe1jTaH'; // 排班表ID

// 获取排班列表
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, storeId, employeeId, pageSize = 100, pageToken } = req.query;
    
    const params = { pageSize: parseInt(pageSize) };
    if (pageToken) params.pageToken = pageToken;
    
    // 构建筛选条件
    const conditions = [];
    
    if (startDate && endDate) {
      const startTimestamp = moment(startDate).valueOf();
      const endTimestamp = moment(endDate).valueOf();
      conditions.push({
        field_name: '日期',
        operator: 'isGreaterEqual',
        value: [startTimestamp]
      });
      conditions.push({
        field_name: '日期',
        operator: 'isLessEqual',
        value: [endTimestamp]
      });
    }
    
    if (storeId) {
      conditions.push({ field_name: '门店', operator: 'is', value: [storeId] });
    }
    
    if (employeeId) {
      conditions.push({ field_name: '分配人员', operator: 'contains', value: [employeeId] });
    }
    
    if (conditions.length > 0) {
      params.filter = {
        conjunction: 'and',
        conditions
      };
    }

    const data = await feishu.listBitableRecords(APP_TOKEN, SCHEDULE_TABLE_ID, params);
    
    const schedules = data.items?.map(item => ({
      recordId: item.record_id,
      scheduleId: item.fields['排班ID'],
      date: item.fields['日期'],
      storeId: item.fields['门店']?.[0]?.text || item.fields['门店'],
      departureTime: item.fields['出发时间'],
      startTime: item.fields['开始时间'],
      endTime: item.fields['结束时间'],
      vehicle: item.fields['车辆'],
      outCommunity: item.fields['出社区分'],
      inCommunity: item.fields['退社区分'],
      assignedEmployees: item.fields['分配人员']?.map(e => e.text || e) || [],
      memberCount: item.fields['编组人数'],
      predictedAmount: item.fields['预测金额'],
      predictedPieces: item.fields['预测件数'],
      predictedQuantity: item.fields['预测数量'],
      currentHR: item.fields['现店铺HR'],
      targetPH: item.fields['目标P/H'],
      createdTime: item.fields['创建时间'],
      modifiedTime: item.fields['修改时间']
    })) || [];

    res.json({
      success: true,
      data: schedules,
      total: data.total || schedules.length,
      hasMore: data.has_more,
      pageToken: data.page_token
    });
  } catch (error) {
    console.error('获取排班列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取单条排班
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await feishu.listBitableRecords(APP_TOKEN, SCHEDULE_TABLE_ID, {
      filter: {
        conjunction: 'and',
        conditions: [{
          field_name: '排班ID',
          operator: 'is',
          value: [id]
        }]
      }
    });

    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ success: false, message: '排班不存在' });
    }

    const item = data.items[0];
    const schedule = {
      recordId: item.record_id,
      scheduleId: item.fields['排班ID'],
      date: item.fields['日期'],
      storeId: item.fields['门店'],
      departureTime: item.fields['出发时间'],
      startTime: item.fields['开始时间'],
      endTime: item.fields['结束时间'],
      vehicle: item.fields['车辆'],
      outCommunity: item.fields['出社区分'],
      inCommunity: item.fields['退社区分'],
      assignedEmployees: item.fields['分配人员'] || [],
      memberCount: item.fields['编组人数'],
      predictedAmount: item.fields['预测金额'],
      predictedPieces: item.fields['预测件数'],
      predictedQuantity: item.fields['预测数量'],
      currentHR: item.fields['现店铺HR'],
      targetPH: item.fields['目标P/H']
    };

    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('获取排班详情失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建排班
router.post('/', async (req, res) => {
  try {
    const {
      scheduleId, date, storeId, departureTime, startTime, endTime,
      vehicle, outCommunity, inCommunity, assignedEmployees,
      predictedAmount, predictedPieces, predictedQuantity, currentHR, targetPH
    } = req.body;
    
    if (!date || !storeId) {
      return res.status(400).json({ success: false, message: '日期和门店不能为空' });
    }

    const finalScheduleId = scheduleId || `SCH${moment().format('YYYYMMDD')}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const memberCount = assignedEmployees?.length || 0;

    const fields = {
      '排班ID': finalScheduleId,
      '日期': parseInt(moment(date).valueOf()),
      '门店': storeId ? [storeId] : [],
      '出发时间': departureTime || '',
      '开始时间': startTime || '',
      '结束时间': endTime || '',
      '车辆': vehicle || '',
      '出社区分': outCommunity || '',
      '退社区分': inCommunity || '',
      '分配人员': assignedEmployees || [],
      '编组人数': memberCount,
      '预测金额': predictedAmount || 0,
      '预测件数': predictedPieces || 0,
      '预测数量': predictedQuantity || 0,
      '现店铺HR': currentHR || 0,
      '目标P/H': targetPH || 0
    };

    const data = await feishu.createBitableRecord(APP_TOKEN, SCHEDULE_TABLE_ID, fields);
    
    res.json({
      success: true,
      message: '排班创建成功',
      data: { recordId: data.record.record_id, scheduleId: finalScheduleId }
    });
  } catch (error) {
    console.error('创建排班失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 批量创建排班
router.post('/batch', async (req, res) => {
  try {
    const { schedules } = req.body;
    
    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ success: false, message: '排班列表不能为空' });
    }

    const records = schedules.map(sch => ({
      fields: {
        '排班ID': sch.scheduleId || `SCH${moment().format('YYYYMMDD')}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        '日期': parseInt(moment(sch.date).valueOf()),
        '门店': sch.storeId ? [sch.storeId] : [],
        '出发时间': sch.departureTime || '',
        '开始时间': sch.startTime || '',
        '结束时间': sch.endTime || '',
        '车辆': sch.vehicle || '',
        '出社区分': sch.outCommunity || '',
        '退社区分': sch.inCommunity || '',
        '分配人员': sch.assignedEmployees || [],
        '编组人数': sch.assignedEmployees?.length || 0,
        '预测金额': sch.predictedAmount || 0,
        '预测件数': sch.predictedPieces || 0,
        '预测数量': sch.predictedQuantity || 0,
        '现店铺HR': sch.currentHR || 0,
        '目标P/H': sch.targetPH || 0
      }
    }));

    const data = await feishu.batchCreateBitableRecords(APP_TOKEN, SCHEDULE_TABLE_ID, records);
    
    res.json({
      success: true,
      message: `成功创建 ${data.records?.length || 0} 条排班`,
      data: { recordIds: data.records?.map(r => r.record_id) }
    });
  } catch (error) {
    console.error('批量创建排班失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新排班
router.put('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const updateData = req.body;

    const fields = {};
    
    if (updateData.date !== undefined) fields['日期'] = parseInt(moment(updateData.date).valueOf());
    if (updateData.storeId !== undefined) fields['门店'] = updateData.storeId ? [updateData.storeId] : [];
    if (updateData.departureTime !== undefined) fields['出发时间'] = updateData.departureTime;
    if (updateData.startTime !== undefined) fields['开始时间'] = updateData.startTime;
    if (updateData.endTime !== undefined) fields['结束时间'] = updateData.endTime;
    if (updateData.vehicle !== undefined) fields['车辆'] = updateData.vehicle;
    if (updateData.outCommunity !== undefined) fields['出社区分'] = updateData.outCommunity;
    if (updateData.inCommunity !== undefined) fields['退社区分'] = updateData.inCommunity;
    if (updateData.assignedEmployees !== undefined) {
      fields['分配人员'] = updateData.assignedEmployees;
      fields['编组人数'] = updateData.assignedEmployees.length;
    }
    if (updateData.predictedAmount !== undefined) fields['预测金额'] = updateData.predictedAmount;
    if (updateData.predictedPieces !== undefined) fields['预测件数'] = updateData.predictedPieces;
    if (updateData.predictedQuantity !== undefined) fields['预测数量'] = updateData.predictedQuantity;
    if (updateData.currentHR !== undefined) fields['现店铺HR'] = updateData.currentHR;
    if (updateData.targetPH !== undefined) fields['目标P/H'] = updateData.targetPH;

    await feishu.updateBitableRecord(APP_TOKEN, SCHEDULE_TABLE_ID, recordId, fields);
    
    res.json({ success: true, message: '排班更新成功' });
  } catch (error) {
    console.error('更新排班失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除排班
router.delete('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    await feishu.deleteBitableRecord(APP_TOKEN, SCHEDULE_TABLE_ID, recordId);
    res.json({ success: true, message: '排班删除成功' });
  } catch (error) {
    console.error('删除排班失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 复制上期排班
router.post('/copy', async (req, res) => {
  try {
    const { sourceWeekStart, targetWeekStart } = req.body;
    
    if (!sourceWeekStart || !targetWeekStart) {
      return res.status(400).json({ success: false, message: '源周和目标周起始日期不能为空' });
    }

    const sourceStart = moment(sourceWeekStart);
    const sourceEnd = moment(sourceWeekStart).add(6, 'days');
    const targetStart = moment(targetWeekStart);
    
    // 获取源周排班
    const sourceData = await feishu.listBitableRecords(APP_TOKEN, SCHEDULE_TABLE_ID, {
      filter: {
        conjunction: 'and',
        conditions: [
          { field_name: '日期', operator: 'isGreaterEqual', value: [sourceStart.format('YYYY-MM-DD')] },
          { field_name: '日期', operator: 'isLessEqual', value: [sourceEnd.format('YYYY-MM-DD')] }
        ]
      },
      pageSize: 500
    });

    if (!sourceData.items || sourceData.items.length === 0) {
      return res.status(404).json({ success: false, message: '源周没有排班数据' });
    }

    // 计算日期差
    const dayDiff = targetStart.diff(sourceStart, 'days');
    
    // 创建新排班
    const newSchedules = sourceData.items.map(item => {
      const sourceDate = moment(item.fields['日期']);
      const newDate = sourceDate.clone().add(dayDiff, 'days');
      
      return {
        scheduleId: `SCH${newDate.format('YYYYMMDD')}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        date: newDate.format('YYYY-MM-DD'),
        storeId: item.fields['门店']?.[0],
        departureTime: item.fields['出发时间'],
        startTime: item.fields['开始时间'],
        endTime: item.fields['结束时间'],
        vehicle: item.fields['车辆'],
        outCommunity: item.fields['出社区分'],
        inCommunity: item.fields['退社区分'],
        assignedEmployees: item.fields['分配人员'] || [],
        predictedAmount: item.fields['预测金额'],
        predictedPieces: item.fields['预测件数'],
        predictedQuantity: item.fields['预测数量'],
        currentHR: item.fields['现店铺HR'],
        targetPH: item.fields['目标P/H']
      };
    });

    // 批量创建
    const records = newSchedules.map(sch => ({
      fields: {
        '排班ID': sch.scheduleId,
        '日期': parseInt(moment(sch.date).valueOf()),
        '门店': sch.storeId ? [sch.storeId] : [],
        '出发时间': sch.departureTime || '',
        '开始时间': sch.startTime || '',
        '结束时间': sch.endTime || '',
        '车辆': sch.vehicle || '',
        '出社区分': sch.outCommunity || '',
        '退社区分': sch.inCommunity || '',
        '分配人员': sch.assignedEmployees,
        '编组人数': sch.assignedEmployees.length,
        '预测金额': sch.predictedAmount || 0,
        '预测件数': sch.predictedPieces || 0,
        '预测数量': sch.predictedQuantity || 0,
        '现店铺HR': sch.currentHR || 0,
        '目标P/H': sch.targetPH || 0
      }
    }));

    const data = await feishu.batchCreateBitableRecords(APP_TOKEN, SCHEDULE_TABLE_ID, records);
    
    res.json({
      success: true,
      message: `成功复制 ${data.records?.length || 0} 条排班`,
      data: {
        sourceWeek: sourceWeekStart,
        targetWeek: targetWeekStart,
        copiedCount: data.records?.length || 0
      }
    });
  } catch (error) {
    console.error('复制排班失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取周视图数据
router.get('/view/weekly', async (req, res) => {
  try {
    const { weekStart } = req.query;
    
    if (!weekStart) {
      return res.status(400).json({ success: false, message: '周起始日期不能为空' });
    }

    const start = moment(weekStart);
    const end = moment(weekStart).add(6, 'days');
    
    const data = await feishu.listBitableRecords(APP_TOKEN, SCHEDULE_TABLE_ID, {
      filter: {
        conjunction: 'and',
        conditions: [
          { field_name: '日期', operator: 'isGreaterEqual', value: [start.format('YYYY-MM-DD')] },
          { field_name: '日期', operator: 'isLessEqual', value: [end.format('YYYY-MM-DD')] }
        ]
      },
      pageSize: 500
    });

    // 按日期分组
    const weeklyData = {};
    for (let i = 0; i < 7; i++) {
      const date = moment(weekStart).add(i, 'days').format('YYYY-MM-DD');
      weeklyData[date] = [];
    }

    data.items?.forEach(item => {
      const date = moment(item.fields['日期']).format('YYYY-MM-DD');
      if (weeklyData[date]) {
        weeklyData[date].push({
          recordId: item.record_id,
          scheduleId: item.fields['排班ID'],
          storeId: item.fields['门店']?.[0],
          departureTime: item.fields['出发时间'],
          startTime: item.fields['开始时间'],
          endTime: item.fields['结束时间'],
          vehicle: item.fields['车辆'],
          assignedEmployees: item.fields['分配人员']?.map(e => e.text || e) || [],
          memberCount: item.fields['编组人数']
        });
      }
    });

    res.json({
      success: true,
      data: {
        weekStart: start.format('YYYY-MM-DD'),
        weekEnd: end.format('YYYY-MM-DD'),
        schedules: weeklyData
      }
    });
  } catch (error) {
    console.error('获取周视图失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;