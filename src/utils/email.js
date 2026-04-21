const nodemailer = require('nodemailer');

// 创建邮件传输器
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.feishu.cn',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// 发送排班通知邮件
const sendScheduleNotification = async (to, scheduleData) => {
  const transporter = createTransporter();
  
  const { employeeName, storeName, date, startTime, endTime, vehicle, tasks } = scheduleData;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3370ff;">排班通知</h2>
      <p>您好 ${employeeName}，</p>
      <p>您有新的排班安排，详情如下：</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f5f6f7;">
          <td style="padding: 12px; border: 1px solid #dee0e3; font-weight: bold;">门店</td>
          <td style="padding: 12px; border: 1px solid #dee0e3;">${storeName}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #dee0e3; font-weight: bold;">日期</td>
          <td style="padding: 12px; border: 1px solid #dee0e3;">${date}</td>
        </tr>
        <tr style="background-color: #f5f6f7;">
          <td style="padding: 12px; border: 1px solid #dee0e3; font-weight: bold;">时间</td>
          <td style="padding: 12px; border: 1px solid #dee0e3;">${startTime} - ${endTime}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #dee0e3; font-weight: bold;">交通方式</td>
          <td style="padding: 12px; border: 1px solid #dee0e3;">${vehicle}</td>
        </tr>
      </table>
      
      <p style="color: #646a73; font-size: 14px;">
        如有疑问，请联系管理员。<br>
        此邮件由系统自动发送，请勿回复。
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"排班系统" <${process.env.SMTP_USER}>`,
    to,
    subject: `排班通知 - ${storeName} ${date}`,
    html: htmlContent
  };

  return await transporter.sendMail(mailOptions);
};

// 发送批量排班通知
const sendBatchScheduleNotification = async (recipients, scheduleData) => {
  const results = [];
  for (const recipient of recipients) {
    try {
      const result = await sendScheduleNotification(recipient.email, {
        ...scheduleData,
        employeeName: recipient.name
      });
      results.push({ email: recipient.email, success: true, messageId: result.messageId });
    } catch (error) {
      results.push({ email: recipient.email, success: false, error: error.message });
    }
  }
  return results;
};

// 发送周排班汇总邮件
const sendWeeklySummary = async (to, weekData) => {
  const transporter = createTransporter();
  
  const { weekRange, schedules, totalEmployees, totalShifts } = weekData;
  
  let scheduleRows = '';
  schedules.forEach(schedule => {
    scheduleRows += `
      <tr>
        <td style="padding: 10px; border: 1px solid #dee0e3;">${schedule.date}</td>
        <td style="padding: 10px; border: 1px solid #dee0e3;">${schedule.storeName}</td>
        <td style="padding: 10px; border: 1px solid #dee0e3;">${schedule.time}</td>
        <td style="padding: 10px; border: 1px solid #dee0e3;">${schedule.employees.join(', ')}</td>
      </tr>
    `;
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <h2 style="color: #3370ff;">周排班汇总</h2>
      <p>排班周期：${weekRange}</p>
      
      <div style="background-color: #f5f6f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>总班次：</strong>${totalShifts}</p>
        <p style="margin: 5px 0;"><strong>涉及员工：</strong>${totalEmployees} 人</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #3370ff; color: white;">
            <th style="padding: 12px; border: 1px solid #dee0e3;">日期</th>
            <th style="padding: 12px; border: 1px solid #dee0e3;">门店</th>
            <th style="padding: 12px; border: 1px solid #dee0e3;">时间</th>
            <th style="padding: 12px; border: 1px solid #dee0e3;">排班人员</th>
          </tr>
        </thead>
        <tbody>
          ${scheduleRows}
        </tbody>
      </table>
    </div>
  `;

  const mailOptions = {
    from: `"排班系统" <${process.env.SMTP_USER}>`,
    to,
    subject: `周排班汇总 - ${weekRange}`,
    html: htmlContent
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendScheduleNotification,
  sendBatchScheduleNotification,
  sendWeeklySummary
};
