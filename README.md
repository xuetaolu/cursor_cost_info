# Cursor 额度信息插件

这是一个 VS Code / Cursor 扩展，用于在状态栏显示 Cursor API 使用额度信息。

## 功能特性

- ✅ 在状态栏实时显示 Cursor API 使用情况（美元格式）
- ✅ 彩色小球指示器（🟢🟡🟠🔴），直观展示使用率
- ✅ 颜色指示：绿色（低）、黄色（中）、橙色（高）、红色（很高）
- ✅ 显示总使用情况：计划使用 + 按需使用
- ✅ 支持自定义按需使用（onDemand）限额
- ✅ 始终可见的 WebView 面板（可选）
- ✅ 智能通知系统：达到配置阈值时自动提醒
- ✅ 显示详细信息：已用额度、总额度、剩余额度、使用百分比
- ✅ 自动定时刷新（默认 1 分钟）
- ✅ 支持手动刷新（点击状态栏或使用命令）
- ✅ 详细的悬浮提示，显示完整的使用统计信息

## 安装

### 从源码安装

1. 克隆或下载此项目
2. 在项目目录下运行：
   ```bash
   npm install
   npm run compile
   ```
3. 在 VS Code 中按 `F5` 调试运行，或打包安装：
   ```bash
   npm install -g vsce
   vsce package
   ```
4. 安装生成的 `.vsix` 文件

## 配置

### 1. 设置 Cookie

**重要：** 插件需要 Cursor 的 Cookie 才能获取额度信息。

1. 获取 Cookie：
   - 在浏览器中访问 [https://cursor.com/cn/dashboard?tab=usage](https://cursor.com/cn/dashboard?tab=usage)
   - 登录你的 Cursor 账号
   - 打开浏览器开发者工具（F12）
   - 切换到 Network（网络）标签
   - 刷新页面，找到对 `usage-summary` 的请求
   - 在请求头中找到 `Cookie` 字段
   - 复制完整的 Cookie 值

2. 在 VS Code 中配置 Cookie：
   - 打开 VS Code 设置（`Cmd+,` 或 `Ctrl+,`）
   - 搜索 `cursorCostInfo.cookie`
   - 将 Cookie 值粘贴到配置中
   - 或者直接编辑 `settings.json`：
     ```json
     {
       "cursorCostInfo.cookie": "你的Cookie值"
     }
     ```

### 2. 配置选项

在 VS Code 设置中搜索 `Cursor Cost Info`，或直接编辑 `settings.json`：

```json
{
  "cursorCostInfo.cookie": "",                    // Cookie 值（必填）
  "cursorCostInfo.refreshInterval": 60000,        // 刷新间隔（毫秒），默认 1 分钟
  "cursorCostInfo.onDemandLimit": null,           // 自定义按需使用限额（美元），null 表示使用 API 返回的值
  "cursorCostInfo.showProgressBar": true,         // 是否在状态栏显示小球指示器，默认 true
  "cursorCostInfo.showWebView": false,            // 是否显示始终可见的 WebView 面板，默认 false
  "cursorCostInfo.enableNotifications": true,     // 是否启用使用率通知，默认 true
  "cursorCostInfo.notificationThresholds": [      // 发送通知的使用率百分比阈值列表
    80, 85, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100
  ]
}
```

**配置说明：**

- `cookie`: Cursor Cookie 值（必填），从浏览器开发者工具获取
- `refreshInterval`: 自动刷新间隔，单位毫秒，默认 60000（1 分钟）
- `onDemandLimit`: 自定义按需使用（onDemand）的限额（美元）
  - 如果设置为 `null`（默认），将使用 API 返回的 `onDemand.limit` 值
  - 如果设置为具体数字（如 `1000`），将使用该值作为 onDemand 限额
  - **总使用量** = `plan.used + onDemand.used`
  - **总限额** = `plan.limit + onDemandLimit`
- `showProgressBar`: 是否在状态栏显示小球指示器，默认 `true`（显示彩色小球 🟢🟡🟠🔴）
- `showWebView`: 是否显示始终可见的 WebView 面板，默认 `false`
- `enableNotifications`: 是否启用使用率通知，默认 `true`
- `notificationThresholds`: 发送通知的使用率百分比阈值列表，默认 `[80, 85, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100]`

## 使用方法

### 查看额度信息

插件激活后，状态栏左侧会显示额度信息，格式如下：

**带小球指示器模式（默认）：**
```
🟡 65% | $103.00/$2,000.00
```

**简洁模式：**
```
Cursor: $103.00/$2,000.00 (5%)
```

**显示说明：**
- 所有金额以美元格式显示（$XX.XX）
- **已用金额** = 计划使用（plan.used）+ 按需使用（onDemand.used）
- **总限额** = 计划限额（plan.limit）+ 按需限额（onDemandLimit，可自定义）
- **百分比** = (已用金额 / 总限额) × 100%
- **颜色指示**：
  - 🟢 绿色（0-50%）：使用率低
  - 🟡 黄色（50-80%）：使用率中等
  - 🟠 橙色（80-90%）：使用率较高（警告背景）
  - 🔴 红色（90-100%）：使用率很高（错误背景）

鼠标悬浮在状态栏项上，可以看到详细的使用统计信息，包括：
- **总计使用**：总已用、总限额、总剩余、使用百分比
- **计划使用（Plan）**：计划内的使用情况
- **按需使用（OnDemand）**：按需使用的详细情况
- **花费明细**：自动花费、API 花费
- **使用明细**：包含、奖励、总计
- **计费周期**：开始和结束时间
- **会员信息**：会员类型、限制类型等

### WebView 面板

启用 `cursorCostInfo.showWebView` 后，会在编辑器旁边显示一个始终可见的 WebView 面板，包含：
- 可视化的文本进度条
- 详细的使用统计
- 实时刷新按钮
- 美观的卡片式布局

面板会自动适配 VS Code 主题颜色，提供更好的视觉体验。

**注意：** 状态栏使用彩色小球（🟢🟡🟠🔴）指示使用率，WebView 面板仍使用文本进度条显示详细进度。

### 刷新数据

有两种方式刷新数据：

1. **点击状态栏**：直接点击状态栏上的额度信息
2. **使用命令**：
   - 按 `Cmd+Shift+P`（Mac）或 `Ctrl+Shift+P`（Windows/Linux）
   - 输入 `刷新 Cursor 额度信息`
   - 回车执行

### 自动刷新

插件会根据配置的刷新间隔自动更新额度信息，默认每 1 分钟刷新一次。

### 使用率通知

当使用率达到配置的阈值时，插件会自动发送通知提醒：

- **80-89%**：警告通知（黄色）
- **90-94%**：错误通知（红色）
- **95-100%**：严重错误通知（红色，带额外提示）

**通知特点：**
- 每个阈值只通知一次，避免重复提醒
- 可自定义通知阈值列表
- 可通过 `cursorCostInfo.enableNotifications` 关闭通知

**默认通知阈值：** `[80, 85, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100]`

例如：使用率从 79% 跳到 82% 时，会触发 80% 阈值通知；从 82% 跳到 87% 时，会触发 85% 阈值通知。

## 故障排除

### 显示"未配置 Cookie"

- 打开 VS Code 设置
- 搜索 `cursorCostInfo.cookie`
- 确认已正确配置 Cookie 值
- 确认 Cookie 格式正确（应该是一长串文本）

### 显示"获取失败"

- 检查网络连接是否正常
- 确认 Cookie 是否过期（重新获取并更新）
- 查看 VS Code 的开发者控制台（Help > Toggle Developer Tools）查看详细错误信息

### Cookie 过期

Cursor 的 Cookie 会定期过期，如果遇到认证失败，需要：
1. 重新访问 Cursor 网站并登录
2. 获取新的 Cookie
3. 在 VS Code 设置中更新 `cursorCostInfo.cookie` 配置

## 数据说明

插件显示的数据来自 Cursor 官方 API (`https://cursor.com/api/usage-summary`)，包括：

- **总使用金额**：计划使用（plan.used）+ 按需使用（onDemand.used），单位：美元
- **总限额**：计划限额（plan.limit）+ 按需限额（onDemandLimit），单位：美元
- **剩余金额**：总限额 - 总使用金额，单位：美元
- **使用百分比**：(总使用金额 / 总限额) × 100%

**注意：** 所有金额都以美元（USD）格式显示，使用标准的货币格式化（如 $1,234.56）。

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听文件变化
npm run watch

# 打包
npm run package
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 隐私说明

- 本插件仅在本地读取 VS Code 配置中的 Cookie
- 仅向 Cursor 官方 API 发送请求
- 不会收集、存储或传输任何用户数据到第三方
- Cookie 信息仅保存在 VS Code 的本地配置中
- 所有数据仅在本地处理，不会上传到任何服务器

## 免责声明

本插件为非官方工具，仅供个人使用。请遵守 Cursor 的服务条款。

