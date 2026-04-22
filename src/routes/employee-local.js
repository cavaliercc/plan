const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const multer = require('multer');
const { employeeStore } = require('../utils/localStore');

// 配置 multer
const upload = multer({ storage: multer.memoryStorage() });

// 获取所有员工
router.get('/', async (req, res) => {
  try {
    const { role, status, storeId, pageSize = 100, pageToken } = req.query;
    
    const params = { pageSize: parseInt(pageSize) };
    if (pageToken) params.pageToken = pageToken;
    if (role) params.role = role;
    if (status) params.status = status;
    if (storeId) params.storeId = storeId;

    const data = employeeStore.list(params);
    
    const employees = data.items?.map(item => ({
      recordId: item.record_id,
      employeeId: item.fields['员工ID'],
      name: item.fields['姓名'],
      employeeNo: item.fields['员工编号'],
      role: item.fields['角色'],
      email: item.fields['邮箱'],
      storeId: item.fields['所属门店'],
      status: item.fields['状态'],
      createdTime: item.fields['创建时间'],
      modifiedTime: item.fields['修改时间']
    })) || [];

    res.json({
      success: true,
      data: employees,
      total: data.total || employees.length,
      hasMore: data.has_more,
      pageToken: data.page_token
    });
  } catch (error) {
    console.error('获取员工列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取单个员工
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = employeeStore.get(id);

    if (!item) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }

    const employee = {
      recordId: item.record_id,
      employeeId: item.fields['员工ID'],
      name: item.fields['姓名'],
      employeeNo: item.fields['员工编号'],
      role: item.fields['角色'],
      email: item.fields['邮箱'],
      storeId: item.fields['所属门店'],
      status: item.fields['状态']
    };

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('获取员工详情失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建员工
router.post('/', async (req, res) => {
  try {
    const { employeeId, name, employeeNo, role, email, storeId, status = '在职' } = req.body;
    
    if (!employeeId || !name) {
      return res.status(400).json({ success: false, message: '员工ID和姓名不能为空' });
    }

    const fields = {
      '员工ID': employeeId,
      '姓名': name,
      '员工编号': employeeNo || '',
      '角色': role || '普通员工',
      '邮箱': email || '',
      '所属门店': storeId || '',
      '状态': status
    };

    const data = employeeStore.create(fields);
    
    res.json({
      success: true,
      message: '员工创建成功',
      data: { recordId: data.record.record_id }
    });
  } catch (error) {
    console.error('创建员工失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 批量创建员工
router.post('/batch', async (req, res) => {
  try {
    const { employees } = req.body;
    
    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ success: false, message: '员工列表不能为空' });
    }

    const recordIds = [];
    for (const emp of employees) {
      const fields = {
        '员工ID': emp.employeeId,
        '姓名': emp.name,
        '员工编号': emp.employeeNo || '',
        '角色': emp.role || '普通员工',
        '邮箱': emp.email || '',
        '所属门店': emp.storeId || '',
        '状态': emp.status || '在职'
      };
      const data = employeeStore.create(fields);
      recordIds.push(data.record.record_id);
    }
    
    res.json({
      success: true,
      message: `成功创建 ${recordIds.length} 个员工`,
      data: { recordIds }
    });
  } catch (error) {
    console.error('批量创建员工失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 从 Excel 导入员工
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传文件' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const employees = data.map(row => ({
      employeeId: row['员工ID'] || row['ID'] || `EMP${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
      name: row['姓名'] || row['名字'] || row['Name'],
      employeeNo: row['员工编号'] || row['编号'] || row['No'] || '',
      role: row['角色'] || row['职位'] || row['Role'] || '普通员工',
      email: row['邮箱'] || row['Email'] || '',
      storeId: row['所属门店'] || row['门店'] || row['Store'] || '',
      status: row['状态'] || row['Status'] || '在职'
    })).filter(emp => emp.name);

    if (employees.length === 0) {
      return res.status(400).json({ success: false, message: '未找到有效的员工数据' });
    }

    const recordIds = [];
    for (const emp of employees) {
      const fields = {
        '员工ID': emp.employeeId,
        '姓名': emp.name,
        '员工编号': emp.employeeNo,
        '角色': emp.role,
        '邮箱': emp.email,
        '所属门店': emp.storeId,
        '状态': emp.status
      };
      const data = employeeStore.create(fields);
      recordIds.push(data.record.record_id);
    }
    
    res.json({
      success: true,
      message: `成功导入 ${recordIds.length} 个员工`,
      data: {
        total: employees.length,
        imported: recordIds.length,
        recordIds
      }
    });
  } catch (error) {
    console.error('导入员工失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新员工
router.put('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { name, employeeNo, role, email, storeId, status } = req.body;

    const fields = {};
    if (name !== undefined) fields['姓名'] = name;
    if (employeeNo !== undefined) fields['员工编号'] = employeeNo;
    if (role !== undefined) fields['角色'] = role;
    if (email !== undefined) fields['邮箱'] = email;
    if (storeId !== undefined) fields['所属门店'] = storeId;
    if (status !== undefined) fields['状态'] = status;

    const data = employeeStore.update(recordId, fields);
    
    if (!data) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }
    
    res.json({ success: true, message: '员工更新成功' });
  } catch (error) {
    console.error('更新员工失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除员工
router.delete('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    employeeStore.delete(recordId);
    res.json({ success: true, message: '员工删除成功' });
  } catch (error) {
    console.error('删除员工失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取角色列表
router.get('/meta/roles', async (req, res) => {
  try {
    res.json({
      success: true,
      data: ['SV', '普通员工', '店长', '副店长']
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
