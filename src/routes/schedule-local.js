const express = require('express');
const router = express.Router();
const moment = require('moment');
const { scheduleStore, storeStore, employeeStore } = require('../utils/localStore');

// 获取排班列表
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, storeId, employeeId, pageSize = 100, pageToken } = req.query;
    
    const params = { pageSize: parseInt(pageSize) };
    if (pageToken) params.pageToken = pageToken;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (storeId) params.storeId = storeId;
    if (employeeId) params.employeeId = employeeId;

    const data = scheduleStore.list(params);
    
    const schedules = data.items?.map(item => ({
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
    const item = scheduleStore.get(id);

    if (!item) {
      return res.status(404).json({ success: false, message: '排班不存在' });
    }

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
      '日期': moment(date).valueOf(),
      '门店': storeId,
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

    const data = scheduleStore.create(fields);
    
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

    const recordIds = [];
    for (const sch of schedules) {
      const fields = {
        '排班ID': sch.scheduleId || `SCH${moment().format('YYYYMMDD')}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        '日期': moment(sch.date).valueOf(),
        '门店': sch.storeId,
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
      };
      const data = scheduleStore.create(fields);
      recordIds.push(data.record.record_id);
    }
    
    res.json({
      success: true,
      message: `成功创建 ${recordIds.length} 条排班`,
      data: { recordIds }
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
    
    if (updateData.date !== undefined) fields['日期'] = moment(updateData.date).valueOf();
    if (updateData.storeId !== undefined) fields['门店'] = updateData.storeId;
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

    const data = scheduleStore.update(recordId, fields);
    
    if (!data) {
      return res.status(404).json({ success: false, message: '排班不存在' });
    }
    
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
    scheduleStore.delete(recordId);
    res.json({ success: true,