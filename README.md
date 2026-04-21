# 排班管理系统

基于 Node.js + Express + 飞书多维表格的排班管理工具。

## 功能特性

- 📅 **排班管理**：周视图日历、日视图编辑、人员分配
- 👥 **员工管理**：信息维护、Excel 导入、角色设置
- 🏪 **门店管理**：门店信息、区域划分
- 📧 **通知系统**：邮件通知、周汇总发送
- 🔄 **快捷操作**：复制上期排班、批量操作

## 技术栈

- 后端：Node.js + Express
- 前端：原生 HTML + CSS + JavaScript
- 数据库：飞书多维表格 (Bitable)
- 部署：PM2

## 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填写飞书配置
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

或使用 PM2：
```bash
./deploy.sh
```

## 飞书配置

### 创建多维表格

创建包含以下数据表的多维表格：

1. **门店信息表** (tblStore)
   - 门店ID (文本)
   - 门店名称 (文本)
   - 店号 (文本)
   - 所属Zone (文本)
   - 地址 (文本)
   - 电话 (文本)
   - 传真 (文本)

2. **员工信息表** (tblEmployee)
   - 员工ID (文本)
   - 姓名 (文本)
   - 员工编号 (文本)
   - 角色 (单选: SV/普通员工/店长/副店长)
   - 邮箱 (文本)
   - 所属门店 (关联)
   - 状态 (单选: 在职/离职)

3. **排班表** (tblSchedule)
   - 排班ID (文本)
   - 日期 (日期)
   - 门店 (关联)
   - 出发时间 (文本)
   - 开始时间 (文本)
   - 结束时间 (文本)
   - 车辆 (单选)
   - 出社区分 (单选)
   - 退社区分 (单选)
   - 分配人员 (关联-多选)
   - 编组人数 (数字)
   - 预测金额 (数字)
   - 预测件数 (数字)
   - 预测数量 (数字)
   - 现店铺HR (数字)
   - 目标P/H (数字)

### 创建飞书应用

1. 进入 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. 获取 App ID 和 App Secret
4. 开通权限：
   - `bitable:app`
   - `bitable:record`
   - `mail:message`
   - `contact:user.base:readonly`

## API 接口

### 门店接口
- `GET /api/stores` - 获取门店列表
- `POST /api/stores` - 创建门店
- `PUT /api/stores/:recordId` - 更新门店
- `DELETE /api/stores/:recordId` - 删除门店

### 员工接口
- `GET /api/employees` - 获取员工列表
- `POST /api/employees` - 创建员工
- `POST /api/employees/batch` - 批量创建
- `POST /api/employees/import` - Excel 导入
- `PUT /api/employees/:recordId` - 更新员工
- `DELETE /api/employees/:recordId` - 删除员工

### 排班接口
- `GET /api/schedules` - 获取排班列表
- `GET /api/schedules/view/weekly` - 周视图
- `POST /api/schedules` - 创建排班
- `POST /api/schedules/batch` - 批量创建
- `POST /api/schedules/copy` - 复制上期
- `PUT /api/schedules/:recordId` - 更新排班
- `DELETE /api/schedules/:recordId` - 删除排班

### 通知接口
- `POST /api/notifications/schedule` - 发送排班通知
- `POST /api/notifications/weekly-summary` - 发送周汇总
- `POST /api/notifications/batch` - 批量通知

## 目录结构

```
plan/
├── src/
│   ├── app.js              # 应用入口
│   ├── routes/
│   │   ├── store.js        # 门店路由
│   │   ├── employee.js     # 员工路由
│   │   ├── schedule.js     # 排班路由
│   │   └── notification.js # 通知路由
│   └── utils/
│       ├── feishu.js       # 飞书 API 封装
│       └── email.js        # 邮件发送
├── public/                 # 前端页面
│   ├── index.html
│   ├── schedule.html
│   ├── employees.html
│   └── stores.html
├── config/                 # 配置文件
├── logs/                   # 日志目录
├── .env                    # 环境变量
├── ecosystem.config.js     # PM2 配置
├── deploy.sh               # 部署脚本
└── package.json
```

## 部署

使用 PM2 部署：

```bash
./deploy.sh
```

手动部署：

```bash
npm install
npm start
```

## 许可证

MIT
