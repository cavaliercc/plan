# 排班管理系统 - 配置指南

## 📋 配置清单

### 第一步：飞书应用配置

#### 1.1 创建应用
1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 点击 **"创建企业自建应用"**
3. 填写应用信息：
   - 应用名称：`排班管理系统`
   - 应用描述：`门店排班、员工管理、通知发送`

#### 1.2 获取凭证
进入 **"凭证与基础信息"** 页面：

```
App ID:     cli_xxxxxxxxxxxxxxxx
App Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 1.3 开通权限
进入 **"权限管理"**，添加以下权限：

| 权限名称 | 权限代码 |
|---------|---------|
| 查看多维表格元数据 | `bitable:app` |
| 读写多维表格记录 | `bitable:record` |
| 读取用户基本信息 | `contact:user.base:readonly` |
| 发送邮件 | `mail:message` |

#### 1.4 发布应用
进入 **"版本管理与发布"**：
1. 点击 **"创建版本"**
2. 版本号：`1.0.0`
3. 更新说明：初始版本
4. 点击 **"保存并发布"**
5. 申请发布（需管理员审批）

---

### 第二步：多维表格配置

#### 2.1 创建多维表格
1. 打开 [飞书多维表格](https://www.feishu.cn/product/bitable)
2. 点击 **"新建多维表格"**
3. 命名为：`排班管理系统`

#### 2.2 获取 App Token
打开创建的多维表格，从浏览器地址栏获取：

```
https://xxx.feishu.cn/base/JcKbbxxxxxxxxxxxxxx
                              ↑ 这部分就是 BITABLE_APP_TOKEN
```

#### 2.3 创建数据表

##### 表 1: 门店信息

**操作**：点击左下角 "+" → 新建数据表 → 命名为 `门店信息`

**添加字段**（点击右上角 "+" 添加字段）：

| 字段名 | 字段类型 | 配置 |
|--------|----------|------|
| 门店ID | 文本 | 必填 |
| 门店名称 | 文本 | 必填 |
| 店号 | 文本 | |
| 所属Zone | 单选 | 选项：上海 Zone、南京 Do、杭州 Do、苏州 Do |
| 地址 | 文本 | |
| 电话 | 文本 | |
| 传真 | 文本 | |

**获取表 ID**：
- 点击表名旁边的 "..." → "表设置"
- 表 ID 格式：`tblxxxxxxxxxxxxxx`

##### 表 2: 员工信息

**操作**：新建数据表 → 命名为 `员工信息`

| 字段名 | 字段类型 | 配置 |
|--------|----------|------|
| 员工ID | 文本 | 必填 |
| 姓名 | 文本 | 必填 |
| 员工编号 | 文本 | |
| 角色 | 单选 | 选项：SV、普通员工、店长、副店长 |
| 邮箱 | 文本 | |
| 所属门店 | 关联 | 关联到「门店信息」表，显示字段：门店名称 |
| 状态 | 单选 | 选项：在职、离职 |

##### 表 3: 排班表

**操作**：新建数据表 → 命名为 `排班表`

| 字段名 | 字段类型 | 配置 |
|--------|----------|------|
| 排班ID | 文本 | 必填 |
| 日期 | 日期 | |
| 门店 | 关联 | 关联到「门店信息」表，显示字段：门店名称 |
| 出发时间 | 文本 | |
| 开始时间 | 文本 | |
| 结束时间 | 文本 | |
| 车辆 | 单选 | 选项：公交、地铁、自驾、其他 |
| 出社区分 | 单选 | 选项：直行公交、换乘公交、地铁直达 |
| 退社区分 | 单选 | 选项：直归公交、换乘公交、地铁直达 |
| 分配人员 | 关联 | 关联到「员工信息」表，允许多选 |
| 编组人数 | 数字 | 公式：COUNT(分配人员) |
| 预测金额 | 数字 | |
| 预测件数 | 数字 | |
| 预测数量 | 数字 | |
| 现店铺HR | 数字 | |
| 目标P/H | 数字 | |

---

### 第三步：邮件配置

#### 3.1 飞书企业邮箱

如果使用飞书企业邮箱：

```
SMTP_HOST=smtp.feishu.cn
SMTP_PORT=587
SMTP_USER=your_email@company.com
SMTP_PASS=your_password_or_app_key
```

#### 3.2 阿里云邮件推送

如果使用阿里云：

```
SMTP_HOST=smtpdm.aliyun.com
SMTP_PORT=465
SMTP_USER=your_email@yourdomain.com
SMTP_PASS=your_smtp_password
```

---

### 第四步：填写配置

复制模板文件并填写实际值：

```bash
cd /root/.openclaw/workspace-coding/plan
cp .env.template .env
nano .env
```

填入以下信息：

```env
# 飞书应用
FEISHU_APP_ID=cli_xxxxxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 多维表格
BITABLE_APP_TOKEN=JcKbbxxxxxxxxxxxxxx
STORE_TABLE_ID=tblxxxxxxxxxxxxxx
EMPLOYEE_TABLE_ID=tblxxxxxxxxxxxxxx
SCHEDULE_TABLE_ID=tblxxxxxxxxxxxxxx

# 邮件
SMTP_USER=your_email@company.com
SMTP_PASS=xxxxxxxxxxxxxxxx
ADMIN_EMAIL=admin@company.com
```

---

### 第五步：启动服务

```bash
# 进入项目目录
cd /root/.openclaw/workspace-coding/plan

# 启动服务
./deploy.sh

# 或手动启动
npm start
```

---

## 🔧 常见问题

### Q1: 如何获取表 ID？
A: 点击表名旁边的 "..." → "表设置"，可以看到表 ID。

### Q2: 应用发布后多久生效？
A: 需要管理员审批，通常几分钟到几小时。

### Q3: 邮件发送失败？
A: 检查 SMTP 配置，确保邮箱已开启 SMTP 服务。

### Q4: 多维表格权限不足？
A: 确保应用已开通 `bitable:app` 和 `bitable:record` 权限。

---

## 📞 技术支持

如有问题，请检查：
1. 飞书应用权限是否正确开通
2. 多维表格 ID 是否正确
3. 环境变量是否配置完整
