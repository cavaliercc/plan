const express = require('express');
const router = express.Router();
const moment = require('moment');
const { sendScheduleNotification, sendBatchScheduleNotification, sendWeeklySummary } = require('../utils/email');
const { scheduleStore, employeeStore, storeStore } = require('../utils/localStore');

// 发送排班通知
router.post('/schedule', async (req, res) => {
  try {
    const { scheduleId, employeeIds, sendEmail = true } = req.body;
    
    if (!scheduleId) {
      return res.status(400).json({ success: false, message: '排班ID不能为空' });
    }

    // 获取排班详情
    const schedule = scheduleStore.get(scheduleId);

    if (!schedule) {
      return res.status(404).json({ success: false, message: '排班不存在' });
    }

    const date = moment(schedule.fields['日期']).format('YYYY-MM-DD');
    const storeId = schedule.fields['门店'];
    
    // 获取门店名称
    let storeName = storeId;
    const store = storeStore.get(storeId);
    if (store) {
      storeName = store.fields['门店名称'];
    }

    // 获取员工信息
    const targetEmployeeIds = employeeIds || schedule.fields['分配人员'] || [];
    const employees = [];
    
    for (const empId of targetEmployeeIds) {
      const emp = employeeStore.get(empId);
      if (emp) {
        employees.push({
          id: emp.fields['员工ID'],
          name: emp.fields['姓名'],
          email: emp.fields['邮箱']
        });
      }
    }

    // 发送邮件通知
    const emailResults = [];
    if (sendEmail) {
      for (const emp of employees) {
        if (emp.email) {
          try {
            await sendScheduleNotification(emp.email, {
              employeeName: emp.name,
              storeName: storeName,
              date: date,
              startTime: schedule.fields['开始时间'],
              endTime: schedule.fields['结束时间'],
              vehicle: schedule.fields['车辆']
            });
            emailResults.push({ employee: emp.name, email: emp.email, success: true });
          } catch (e) {
            emailResults.push({ employee: emp.name, email: emp.email, success: false, error: e.message });
          }
        }
      }
    }

    res.json({
      success: true,
      message: '通知发送完成',
      data: {
        scheduleId,
        date,
        storeName,
        notifiedEmployees: employees.length,
        emailResults
      }
    });
  } catch (error) {
    console.error('发送排班通知失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 发送周排班汇总
router.post('/weekly-summary', async (req, res) => {
  try {
    const { weekStart, to } = req.body;
    
    if (!weekStart) {
      return res.status(400).json({ success: false, message: '周起始日期不能为空' });
    }

    const start = moment(weekStart);
    const end = moment(weekStart).add(6, 'days');
    
    // 获取本周排班
    const scheduleData = scheduleStore.list({
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD')
    });

    if (!scheduleData.items || scheduleData.items.length === 0) {
      return res.status(404).json({ success: false, message: '本周没有排班数据' });
    }

    // 构建汇总数据
    const schedules = scheduleData.items.map(item => ({
      date: moment(item.fields['日期']).format('YYYY-MM-DD'),
      storeName: item.fields['门店'],
      time: `${item.fields['开始时间']} - ${item.fields['结束时间']}`,
      employees: item.fields['分配人员'] || []
    }));

    const allEmployees = new Set();
    schedules.forEach(s => s.employees.forEach(e => allEmployees.add(e)));

    const weekData = {
      weekRange: `${start.format('YYYY-MM-DD')} 至 ${end.format('YYYY-MM-DD')}`,
      schedules,
      totalEmployees: allEmployees.size,
      totalShifts: schedules.length
    };

    // 发送邮件
    let emailResult = null;
    if (to) {
      try {
        emailResult = await sendWeeklySummary(to, weekData);
      } catch (e) {
        console.error('发送邮件失败:', e.message);
      }
    }

    res.json({
      success: true,
      message: '周排班汇总生成完成',
      data: {
        weekRange: weekData.weekRange,
        totalEmployees: weekData.totalEmployees,
        totalShifts: weekData.totalShifts,
        emailSent: emailResult ? true : false
      }
    });
  } catch (error) {
    console.error('发送周排班汇总失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 发送批量通知
router.post('/batch', async (req, res) => {
  try {
    const { scheduleIds, sendEmail = true } = req.body;
    
    if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
      return res.status(400).json({ success: false, message: '排班ID列表不能为空' });
    }

    const results = [];
    
    for (const scheduleId of scheduleIds) {
      try {
        // 获取排班详情
        const schedule = scheduleStore.get(scheduleId);

        if (!schedule) {
          results.push({ scheduleId, success: false, error: '排班不存在' });
          continue;
        }

        const date = moment(schedule.fields['日期']).format('YYYY-MM-DD');
        const storeId = schedule.fields['门店'];
        
        // 获取门店名称
        let storeName = storeId;
        const store = storeStore.get(storeId);
        if (store) {
          storeName = store.fields['门店名称'];
        }

        // 获取员工信息并发送通知
        const assignedEmployees = schedule.fields['分配人员'] || [];
        const employees = [];
        
        for (const empId of assignedEmployees) {
          const emp = employeeStore.get(empId);
          if (emp) {
            employees.push({
              id: emp.fields['员工ID'],
              name: emp.fields['姓名'],
              email: emp.fields['邮箱']
            });
          }
        }

        // 发送邮件
        let emailCount = 0;
        if (sendEmail) {
          for (const emp of employees) {
            if (emp.email) {
              try {
                await sendScheduleNotification(emp.email, {
                  employeeName: emp.name,
                  storeName: storeName,
                  date: date,
                  startTime: schedule.fields['开始时间'],
                  endTime: schedule.fields['结束时间'],
                  vehicle: schedule.fields['车辆']
                });
                emailCount++;
              } catch (e) {
                console.error(`发送邮件给 ${emp.name} 失败:`, e.message);
              }
            }
          }
        }

        results.push({
          scheduleId,
          success: true,
          date,
          storeName,
          employeeCount: employees.length,
          emailSent: emailCount
        });
      } catch (error) {
        results.push({ scheduleId, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `批量通知完成，成功 ${successCount}/${scheduleIds.length}`,
      data: { total: scheduleIds.length, success: successCount, results }
    });
  } catch (error) {
    console.error('批量发送通知失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
