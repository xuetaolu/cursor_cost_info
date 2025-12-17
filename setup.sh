#!/bin/bash

echo "==================================="
echo "Cursor 额度信息插件 - 安装向导"
echo "==================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js (https://nodejs.org/)"
    exit 1
fi

echo "✓ Node.js 版本: $(node --version)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm"
    exit 1
fi

echo "✓ npm 版本: $(npm --version)"
echo ""

# 安装依赖
echo "📦 安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✓ 依赖安装成功"
echo ""

# 检查配置文件
CONFIG_FILE="$HOME/.config/cursor_cookie"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "⚠️  配置文件不存在: $CONFIG_FILE"
    echo ""
    echo "正在创建配置文件..."
    mkdir -p "$HOME/.config"
    touch "$CONFIG_FILE"
    echo "✓ 配置文件已创建"
    echo ""
    echo "📝 请按照以下步骤配置 Cookie:"
    echo ""
    echo "1. 在浏览器中访问: https://cursor.com/cn/dashboard?tab=usage"
    echo "2. 登录你的 Cursor 账号"
    echo "3. 打开浏览器开发者工具 (F12)"
    echo "4. 切换到 Network (网络) 标签"
    echo "5. 刷新页面"
    echo "6. 找到 'usage-summary' 请求"
    echo "7. 查看请求头中的 Cookie 字段"
    echo "8. 复制完整的 Cookie 值"
    echo "9. 将 Cookie 保存到: $CONFIG_FILE"
    echo ""
    echo "然后运行: echo '你的Cookie' > $CONFIG_FILE"
    echo ""
else
    # 检查配置文件是否为空
    if [ ! -s "$CONFIG_FILE" ]; then
        echo "⚠️  配置文件为空: $CONFIG_FILE"
        echo "请添加你的 Cursor Cookie 到该文件"
        echo ""
    else
        echo "✓ 配置文件存在: $CONFIG_FILE"
        COOKIE_LENGTH=$(wc -c < "$CONFIG_FILE" | tr -d ' ')
        echo "  Cookie 长度: $COOKIE_LENGTH 字符"
        echo ""
    fi
fi

# 编译项目
echo "🔨 编译项目..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi

echo "✓ 编译成功"
echo ""

echo "==================================="
echo "✅ 安装完成！"
echo "==================================="
echo ""
echo "下一步:"
echo ""
echo "1. 确保已配置 Cookie (在 $CONFIG_FILE)"
echo "2. 在 VS Code 中打开此项目"
echo "3. 按 F5 启动调试"
echo "4. 或运行 'npm run package' 打包安装"
echo ""
echo "详细说明请查看 README.md 和 INSTALL.md"
echo ""

