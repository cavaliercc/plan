#!/bin/bash

# 排班管理系统部署脚本

echo "🚀 开始部署排班管理系统..."

# 安装依赖
echo "📦 安装依赖..."
npm install

# 创建日志目录
mkdir -p logs

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "📥 安装 PM2..."
    npm install -g pm2
fi

# 停止旧服务
echo "🛑 停止旧服务..."
pm2 stop schedule-manager 2>/dev/null || true

# 启动服务
echo "▶️ 启动服务..."
pm2 start ecosystem.config.js

# 保存 PM2 配置
echo "💾 保存 PM2 配置..."
pm2 save

# 设置开机自启
echo "⚙️ 设置开机自启..."
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "✅ 部署完成！"
echo ""
echo "📋 服务信息："
echo "  - 访问地址: http://$(hostname -I | awk '{print $1}'):3000"
echo "  - 日志查看: pm2 logs schedule-manager"
echo "  - 重启服务: pm2 restart schedule-manager"
echo "  - 停止服务: pm2 stop schedule-manager"
echo ""
echo "⚠️  重要提示："
echo "  1. 请修改 .env 文件中的飞书配置"
echo "  2. 请配置多维表格 token 和表 ID"
echo "  3. 请配置邮件 SMTP 信息"
