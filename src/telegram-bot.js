const TelegramBot = require('node-telegram-bot-api');
const winston = require('winston');

class TelegramNotifier {
  constructor() {
    this.bot = null;
    this.chatId = null;
    this.isEnabled = false;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
    
    this.initialize();
  }

  initialize() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      this.logger.warn('Telegram bot not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable notifications.');
      return;
    }

    try {
      this.bot = new TelegramBot(botToken, { polling: true }); // 开启polling监听消息
      this.chatId = chatId;
      this.isEnabled = true;
      this.logger.info('Telegram bot initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Telegram bot:', error);
    }
  }

  // 注册/check命令处理
  onCheckCommand(handler) {
    if (!this.isEnabled || !this.bot) return;
    this.bot.onText(/^\/check$/, async (msg) => {
      if (msg.chat && msg.chat.id && msg.chat.id.toString() === this.chatId.toString()) {
        await handler(msg);
      }
    });
  }

  // 注册/status命令处理
  onStatusCommand(handler) {
    if (!this.isEnabled || !this.bot) return;
    this.bot.onText(/^\/status$/, async (msg) => {
      if (msg.chat && msg.chat.id && msg.chat.id.toString() === this.chatId.toString()) {
        await handler(msg);
      }
    });
  }

  async sendMessage(message, options = {}) {
    if (!this.isEnabled || !this.bot || !this.chatId) {
      this.logger.debug('Telegram bot not available, skipping message');
      return false;
    }

    try {
      const defaultOptions = {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      };

      const finalOptions = { ...defaultOptions, ...options };
      
      await this.bot.sendMessage(this.chatId, message, finalOptions);
      this.logger.debug('Telegram message sent successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to send Telegram message:', error);
      return false;
    }
  }

  async sendAlert(message, isUrgent = false) {
    const prefix = isUrgent ? '🚨 <b>紧急警报</b>\n' : '⚠️ <b>警告</b>\n';
    const formattedMessage = `${prefix}${message}`;
    
    return await this.sendMessage(formattedMessage);
  }

  async sendInfo(message) {
    const formattedMessage = `ℹ️ <b>信息</b>\n${message}`;
    return await this.sendMessage(formattedMessage);
  }

  async sendSuccess(message) {
    const formattedMessage = `✅ <b>成功</b>\n${message}`;
    return await this.sendMessage(formattedMessage);
  }

  async sendError(message) {
    const formattedMessage = `❌ <b>错误</b>\n${message}`;
    return await this.sendMessage(formattedMessage);
  }

  async sendStartupNotification(config) {
    const message = `
🚀 <b>钱包监控程序已启动</b>

📊 <b>监控信息：</b>
• 监控地址: <code>${config.compromisedAddress}</code>
• 安全地址: <code>${config.safeAddress}</code>
• 检查间隔: ${config.checkInterval}ms
• 最小金额: ${config.minEthAmount} ETH

🔧 <b>配置信息：</b>
• RPC提供商数量: ${config.rpcProvidersCount}
• 最大重试次数: ${config.maxRetries}
• 重试延迟: ${config.retryDelay}ms

⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}
    `;

    return await this.sendMessage(message);
  }

  async sendShutdownNotification(reason = '未知原因') {
    const message = `
🛑 <b>钱包监控程序已停止</b>

📋 <b>停止原因：</b>
${reason}

⏰ 停止时间: ${new Date().toLocaleString('zh-CN')}

⚠️ <b>请注意：</b>
程序停止后，钱包将不再受到监控保护！
    `;

    return await this.sendAlert(message, true);
  }

  async sendTransferNotification(amount, txHash, gasUsed) {
    const message = `
💰 <b>ETH转移成功</b>

📊 <b>转移详情：</b>
• 转移金额: ${amount} ETH
• 交易哈希: <code>${txHash}</code>
• Gas费用: ${gasUsed} ETH

⏰ 转移时间: ${new Date().toLocaleString('zh-CN')}

🔗 <b>查看交易：</b>
https://etherscan.io/tx/${txHash}
    `;

    return await this.sendSuccess(message);
  }

  async sendBalanceAlert(balance, threshold) {
    const message = `
💡 <b>余额提醒</b>

💰 <b>当前余额：</b>
• 监控地址余额: ${balance} ETH
• 转移阈值: ${threshold} ETH

⏰ 检查时间: ${new Date().toLocaleString('zh-CN')}

📊 <b>状态：</b>
${parseFloat(balance) >= parseFloat(threshold) ? '✅ 余额充足，准备转移' : '⏳ 余额不足，继续监控'}
    `;

    return await this.sendInfo(message);
  }

  async sendNetworkError(error, providerIndex, retryCount) {
    const message = `
🌐 <b>网络错误</b>

❌ <b>错误详情：</b>
• 错误类型: ${error.code || '未知'}
• 错误信息: ${error.message}
• RPC提供商: ${providerIndex + 1}
• 重试次数: ${retryCount}

⏰ 发生时间: ${new Date().toLocaleString('zh-CN')}

🔄 <b>处理状态：</b>
程序将自动切换到备用RPC提供商并重试
    `;

    return await this.sendAlert(message);
  }

  async sendHealthCheck(status) {
    const message = `
🏥 <b>健康检查</b>

📊 <b>程序状态：</b>
• 运行状态: ${status.isRunning ? '✅ 正常运行' : '❌ 已停止'}
• 连续错误: ${status.consecutiveErrors}
• 最后检查: ${status.lastCheckTime}
• 当前余额: ${status.currentBalance} ETH

⏰ 检查时间: ${new Date().toLocaleString('zh-CN')}
    `;

    return await this.sendInfo(message);
  }

  async sendTestMessage() {
    const message = `
🧪 <b>测试消息</b>

✅ 电报机器人配置正确！

📋 <b>测试信息：</b>
• 机器人状态: 正常
• 消息发送: 成功
• 时间戳: ${new Date().toLocaleString('zh-CN')}

如果您收到此消息，说明电报通知功能已正常工作。
    `;

    return await this.sendMessage(message);
  }
}

module.exports = TelegramNotifier; 