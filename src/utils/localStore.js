const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../../data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 获取文件路径
const getFilePath = (tableName) => path.join(DATA_DIR, `${tableName}.json`);

// 读取数据
const readData = (tableName) => {
  const filePath = getFilePath(tableName);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`读取 ${tableName} 数据失败:`, error);
    return [];
  }
};

// 写入数据
const writeData = (tableName, data) => {
  const filePath = getFilePath(tableName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`写入 ${tableName} 数据失败:`, error);
    return false;
  }
};

// 生成记录ID
const generateRecordId = () => {
  return `rec${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
};

// 门店存储
const storeStore = {
  list: (params = {}) => {
    let data = readData('stores');
    const { zone, pageSize = 100, pageToken } = params;
    
    if (zone) {
      data = data.filter(item => item.fields['所属Zone'] === zone);
    }
    
    const total = data.length;
    const hasMore = false;
    
    return {
      items: data.map(item => ({
        record_id: item.record_id,
        fields: item.fields
      })),
      total,
      has_more: hasMore
    };
  },
  
  get: (storeId) => {
    const data = readData('stores');
    return data.find(item => item.fields['门店ID'] === storeId);
  },
  
  create: (fields) => {
    const data = readData('stores');
    const recordId = generateRecordId();
    const newRecord = {
      record_id: recordId,
      fields: {
        ...fields,
        '创建时间': Date.now(),
        '修改时间': Date.now()
      }
    };
    data.push(newRecord);
    writeData('stores', data);
    return { record: newRecord };
  },
  
  update: (recordId, fields) => {
    const data = readData('stores');
    const index = data.findIndex(item => item.record_id === recordId);
    if (index === -1) return null;
    
    data[index].fields = {
      ...data[index].fields,
      ...fields,
      '修改时间': Date.now()
    };
    writeData('stores', data);
    return { record: data[index] };
  },
  
  delete: (recordId) => {
    const data = readData('stores');
    const newData = data.filter(item => item.record_id !== recordId);
    writeData('stores', newData);
    return true;
  }
};

// 员工存储
const employeeStore = {
  list: (params = {}) => {
    let data = readData('employees');
    const { role, status, storeId, pageSize = 100 } = params;
    
    if (role) {
      data = data.filter(item => item.fields['角色'] === role);
    }
    if (status) {
      data = data.filter(item => item.fields['状态'] === status);
    }
    if (storeId) {
      data = data.filter(item => item.fields['所属门店'] === storeId);
    }
    
    return {
      items: data.map(item => ({
        record_id: item.record_id,
        fields: item.fields
      })),
      total: data.length,
      has_more: false
    };
  },
  
  get: (employeeId) => {
    const data = readData('employees');
    return data.find(item => item.fields['员工ID'] === employeeId);
  },
  
  create: (fields) => {
    const data = readData('employees');
    const recordId = generateRecordId();
    const newRecord = {
      record_id: recordId,
      fields: {
        ...fields,
        '创建时间': Date.now(),
        '修改时间': Date.now()
      }
    };
    data.push(newRecord);
    writeData('employees', data);
    return { record: newRecord };
  },
  
  update: (recordId, fields) => {
    const data = readData('employees');
    const index = data.findIndex(item => item.record_id === recordId);
    if (index === -1) return null;
    
    data[index].fields = {
      ...data[index].fields,
      ...fields,
      '修改时间': Date.now()
    };
    writeData('employees', data);
    return { record: data[index] };
  },
  
  delete: (recordId) => {
    const data = readData('employees');
    const newData = data.filter(item => item.record_id !== recordId);
    writeData('employees', newData);
    return true;
  }
};

// 排班存储
const scheduleStore = {
  list: (params = {}) => {
    let data = readData('schedules');
    const { startDate, endDate, storeId, employeeId } = params;
    
    if (startDate && endDate) {
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime();
      data = data.filter(item => {
        const itemDate = item.fields['日期'];
        return itemDate >= startTimestamp && itemDate <= endTimestamp;
      });
    }
    
    if (storeId) {
      data = data.filter(item => item.fields['门店'] === storeId);
    }
    
    if (employeeId) {
      data = data.filter(item => {
        const employees = item.fields['分配人员'] || [];
        return employees.includes(employeeId);
      });
    }
    
    return {
      items: data.map(item => ({
        record_id: item.record_id,
        fields: item.fields
      })),
      total: data.length,
      has_more: false
    };
  },
  
  get: (scheduleId) => {
    const data = readData('schedules');
    return data.find(item => item.fields['排班ID'] === scheduleId);
  },
  
  create: (fields) => {
    const data = readData('schedules');
    const recordId = generateRecordId();
    const newRecord = {
      record_id: recordId,
      fields: {
        ...fields,
        '创建时间': Date.now(),
        '修改时间': Date.now()
      }
    };
    data.push(newRecord);
    writeData('schedules', data);
    return { record: newRecord };
  },
  
  update: (recordId, fields) => {
    const data = readData('schedules');
    const index = data.findIndex(item => item.record_id === recordId);
    if (index === -1) return null;
    
    data[index].fields = {
      ...data[index].fields,
      ...fields,
      '修改时间': Date.now()
    };
    writeData('schedules', data);
    return { record: data[index] };
  },
  
  delete: (recordId) => {
    const data = readData('schedules');
    const newData = data.filter(item => item.record_id !== recordId);
    writeData('schedules', newData);
    return true;
  }
};

module.exports = {
  storeStore,
  employeeStore,
  scheduleStore
};
