// 测试排班 API
const API_BASE = 'http://127.0.0.1:3000';

async function testScheduleAPI() {
  console.log('=== 测试排班 API ===\n');

  // 1. 获取门店列表
  console.log('1. 获取门店列表...');
  const storesRes = await fetch(`${API_BASE}/api/stores`);
  const storesData = await storesRes.json();
  console.log('门店:', storesData.success ? `${storesData.data.length} 个` : '失败');

  // 2. 获取员工列表
  console.log('2. 获取员工列表...');
  const empRes = await fetch(`${API_BASE}/api/employees?status=在职`);
  const empData = await empRes.json();
  console.log('员工:', empData.success ? `${empData.data.length} 个` : '失败');

  if (storesData.data.length === 0) {
    console.log('\n❌ 没有门店数据，无法创建排班');
    return;
  }

  if (empData.data.length === 0) {
    console.log('\n❌ 没有员工数据，无法创建排班');
    return;
  }

  const storeId = storesData.data[0].storeId;
  const employeeId = empData.data[0].employeeId;

  // 3. 创建排班
  console.log('\n3. 创建排班...');
  const createRes = await fetch(`${API_BASE}/api/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: '2026-04-23',
      storeId: storeId,
      departureTime: '19:45',
      startTime: '20:00',
      endTime: '29:00',
      vehicle: '公交',
      assignedEmployees: [employeeId]
    })
  });
  const createData = await createRes.json();
  console.log('创建结果:', createData.success ? '成功' : '失败', createData.message || '');

  // 4. 获取排班列表
  console.log('\n4. 获取排班列表...');
  const listRes = await fetch(`${API_BASE}/api/schedules?startDate=2026-04-20&endDate=2026-04-26`);
  const listData = await listRes.json();
  console.log('排班:', listData.success ? `${listData.data.length} 条` : '失败');

  console.log('\n=== 测试完成 ===');
}

testScheduleAPI().catch(console.error);
