#!/bin/bash

# 排班管理系统配置更新脚本

echo "🔧 排班管理系统配置更新"
echo "========================"
echo ""

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
    echo "❌ .env 文件不存在，正在从模板创建..."
    cp .env.template .env
fi

# 备份原配置
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ 已备份原配置"
echo ""

# 交互式输入配置
echo "请输入飞书应用配置："
echo "--------------------"

read -p "FEISHU_APP_ID (格式: cli_xxxxxxxx): " APP_ID
read -p "FEISHU_APP_SECRET: " APP_SECRET

echo ""
echo "请输入多维表格配置："
echo "--------------------"
read -p "BITABLE_APP_TOKEN (从表格URL获取): " BITABLE_TOKEN

echo ""
echo "请输入邮件配置："
echo "--------------------"
read -p "SMTP_USER (邮箱地址): " SMTP_USER
read -sp "SMTP_PASS (邮箱密码或SMTP密钥): " SMTP_PASS
echo ""

# 更新 .env 文件
cat > .env << EOF
# 飞书配置
FEISHU_APP_ID=${APP_ID}
FEISHU_APP_SECRET=${APP_SECRET}
FEISHU_ENCRYPT_KEY=
FEISHU_VERIFICATION_TOKEN=

# 多维表格配置
BITABLE_APP_TOKEN=${BITABLE_TOKEN}

# 服务器配置
PORT=3000
NODE_ENV=production

# 邮件配置
SMTP_HOST=smtp.feishu.cn
SMTP_PORT=587
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

# 管理员配置
ADMIN_EMAIL=${SMTP_USER}
EOF

echo ""
echo "✅ 配置已更新！"
echo ""
echo "📋 配置预览："
echo "--------------------"
grep -E "^(FEISHU_APP_ID|BITABLE_APP_TOKEN|SMTP_USER)" .env
echo ""
echo "🚀 现在可以启动服务了："
echo "   ./deploy.sh"
echo ""
