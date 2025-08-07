# 电报机器人设置指南

## 📱 概述

电报机器人可以让您在程序中断时收到即时通知，确保您能及时了解监控程序的状态。

## 🚀 快速设置步骤

### 步骤1: 创建电报机器人

1. **打开电报**，搜索 `@BotFather`
2. **发送命令** `/newbot`
3. **输入机器人名称**（例如：Wallet Monitor Bot）
4. **输入机器人用户名**（必须以 `bot` 结尾，例如：wallet_monitor_bot）
5. **保存机器人Token**（格式：`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 步骤2: 获取Chat ID

#### 方法1: 使用 @userinfobot
1. 搜索 `@userinfobot`
2. 发送 `/start`
3. 机器人会返回您的 Chat ID

#### 方法2: 手动获取
1. 向您的机器人发送 `/start`
2. 访问：`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. 在返回的JSON中找到 `"chat":{"id":123456789}`

### 步骤3: 配置环境变量

在您的 `.env` 文件中添加：

```bash
# 电报机器人配置
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### 步骤4: 安装依赖

```bash
npm install node-telegram-bot-api
```

### 步骤5: 测试配置

```bash
node -e "
const TelegramNotifier = require('./telegram-bot');
const notifier = new TelegramNotifier();
notifier.sendTestMessage().then(() => {
  console.log('测试消息已发送！');
  process.exit(0);
}).catch(err => {
  console.error('发送失败:', err);
  process.exit(1);
});
"
```

## 🔧 详细设置说明

### 创建机器人的详细步骤

1. **找到BotFather**
   - 在电报中搜索 `@BotFather`
   - 点击开始对话

2. **创建新机器人**
   ```
   您: /newbot
   BotFather: Alright, a new bot. How are we going to call it? Please choose a name for your bot.
   您: Wallet Monitor Bot
   BotFather: Good. Now let's choose a username for your bot. It must end in `bot`. Like this: TetrisBot or tetris_bot.
   您: wallet_monitor_bot
   BotFather: Done! Congratulations on your new bot. You will find it at t.me/wallet_monitor_bot. You can now add a description, about section and profile picture for your bot, see /help for a list of commands. By the way, when you've finished creating your cool bot, ping our Bot Support if you want a better username for it. Just make sure the bot is fully operational before you do this.
   
   Use this token to access the HTTP API:
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   
   Keep your token secure and store it safely, it can be used by anyone to control your bot.
   ```

3. **保存Token**
   - 复制上面的Token（`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）
   - 这是您的机器人访问密钥

### 获取Chat ID的详细步骤

#### 方法1: 使用 @userinfobot（推荐）

1. 搜索 `@userinfobot`
2. 发送 `/start`
3. 机器人会返回类似信息：
   ```
   👤 User Info:
   🆔 ID: 123456789
   👤 First Name: Your Name
   📝 Username: @yourusername
   ```

#### 方法2: 手动获取

1. 向您的机器人发送 `/start`
2. 在浏览器中访问：
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
3. 您会看到类似这样的JSON：
   ```json
   {
     "ok": true,
     "result": [
       {
         "update_id": 123456789,
         "message": {
           "message_id": 1,
           "from": {
             "id": 123456789,
             "is_bot": false,
             "first_name": "Your Name",
             "username": "yourusername"
           },
           "chat": {
             "id": 123456789,
             "first_name": "Your Name",
             "username": "yourusername",
             "type": "private"
           },
           "date": 1234567890,
           "text": "/start"
         }
       }
     ]
   }
   ```
4. 找到 `"chat":{"id":123456789}` 中的数字

## 📋 通知类型

程序会发送以下类型的通知：

### 🚀 启动通知
- 程序启动时发送
- 包含监控配置信息

### 💰 转移通知
- ETH转移成功时发送
- 包含转移金额和交易哈希

### ⚠️ 警告通知
- 网络错误时发送
- 包含错误详情和处理状态

### 🛑 停止通知
- 程序停止时发送（紧急）
- 包含停止原因和时间

### 🏥 健康检查
- 定期状态报告
- 包含运行状态和余额信息

## 🔍 故障排除

### 问题1: 机器人不响应
**解决方案：**
1. 确保机器人Token正确
2. 确保Chat ID正确
3. 确保向机器人发送了 `/start`

### 问题2: 收不到通知
**解决方案：**
1. 检查网络连接
2. 检查环境变量配置
3. 运行测试脚本验证

### 问题3: 机器人被阻止
**解决方案：**
1. 在电报中搜索您的机器人
2. 点击 "Start" 或 "开始"
3. 重新运行程序

## 🛡️ 安全建议

1. **保护Token**
   - 不要分享您的机器人Token
   - 定期更换Token
   - 使用环境变量存储

2. **限制访问**
   - 只向信任的人分享机器人链接
   - 定期检查机器人设置

3. **监控使用**
   - 定期检查机器人消息历史
   - 注意异常活动

## 📞 支持

如果遇到问题：
1. 检查本指南的所有步骤
2. 运行测试脚本
3. 查看程序日志
4. 确保网络连接正常

## 🎯 高级功能

### 自定义通知
您可以修改 `telegram-bot.js` 来自定义通知格式和内容。

### 多用户支持
可以配置多个Chat ID，用逗号分隔：
```bash
TELEGRAM_CHAT_ID=123456789,987654321
```

### 通知频率控制
可以添加环境变量来控制通知频率：
```bash
TELEGRAM_NOTIFICATION_INTERVAL=300000  # 5分钟
```

现在您的钱包监控程序具备了完整的电报通知功能！ 