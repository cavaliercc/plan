const { storeStore, employeeStore, scheduleStore } = require('./src/utils/localStore');

console.log('=== 测试本地存储 ===\n');

// 测试门店存储
console.log('1. 测试门店存储');
const storeData = storeStore.create({
  '门店ID': 'STORE001',
  '门店名称': '测试门店',
  '店号': 'M0001',
  '所属Zone': '上海 Zone',
  '地址': '上海市测试路1号',
  '电话': '021-12345678',
  '传真': '021-87654321'
});
console.log('创建门店:', storeData.record.record_id);

const stores = storeStore.list();
console.log('门店列表:', stores.items.length, '条记录');

// 测试员工存储
console.log('\n2. 测试员工存储');
const empData = employeeStore.create({
  '员工ID': 'EMP001',
  '姓名': '张三',
  '员工编号': '2500001',
  '角色': '普通员工',
  '邮箱': 'zhangsan@test.com',
  '所属门店': 'STORE001',
  '状态': '在职'
});
console.log('创建员工:', empData.record.record_id);

const employees = employeeStore.list();
console.log('员工列表:', employees.items.length, '条记录');

// 测试排班存储
console.log('\n3. 测试排班存储');
const schData = scheduleStore.create({
  '排班ID': 'SCH001',
  '日期': Date.now(),
  '门店': 'STORE001',
  '出发时间': '19:45',
  '开始时间': '20:00',
  '结束时间': '29:00',
  '车辆': '公交',
  '出社区分': '直行公交',
  '退社区分': '直归公交',
  '分配人员': ['EMP001'],
  '编组人数': 1,
  '预测金额': 1000,
  '预测件数': 50,
  '预测数量': 100,
  '现店铺HR': 5,
  '目标P/H': 20
});
console.log('创建排班:', schData.record.record_id);

const schedules = scheduleStore.list();
console.log('排班列表:', schedules.items.length, '条记录');

console.log('\n=== 测试完成 ===');
