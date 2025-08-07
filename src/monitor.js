const { Web3, utils } = require('web3');
const winston = require('winston');
const TelegramNotifier = require('./telegram-bot');
require('dotenv').config();

// 配置日志
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'wallet-monitor' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class WalletMonitor {
  constructor() {
    this.rpcUrls = [process.env.RPC_URL].filter(Boolean);
    if (process.env.RPC_URL_1) this.rpcUrls.push(process.env.RPC_URL_1);
    if (process.env.RPC_URL_2) this.rpcUrls.push(process.env.RPC_URL_2);
    this.currentRpcIndex = 0;
    this.web3 = new Web3(this.rpcUrls[this.currentRpcIndex]);
    this.compromisedAddress = process.env.COMPROMISED_WALLET_ADDRESS;
    this.safeAddress = process.env.SAFE_WALLET_ADDRESS;
    this.privateKey = process.env.COMPROMISED_WALLET_PRIVATE_KEY;
    this.minEthAmount = utils.toWei(process.env.MIN_ETH_AMOUNT || '0.001', 'ether');
    this.checkInterval = parseInt(process.env.CHECK_INTERVAL) || 10000;
    this.gasLimit = parseInt(process.env.GAS_LIMIT) || 21000;
    this.gasPriceGwei = parseInt(process.env.GAS_PRICE_GWEI) || 20;
    
    this.lastBalance = '0';
    this.isProcessing = false;
    this.lastBalanceStatus = null; // 记录上一次余额状态
    this.transferHistory = [];
    
    // 电报通知
    this.telegram = new TelegramNotifier();
    this.startTime = new Date();
    this.isRunning = true;
    
    this.validateConfig();
  }

  validateConfig() {
    const requiredFields = [
      'RPC_URL',
      'COMPROMISED_WALLET_ADDRESS', 
      'SAFE_WALLET_ADDRESS',
      'COMPROMISED_WALLET_PRIVATE_KEY'
    ];

    for (const field of requiredFields) {
      if (!process.env[field]) {
        throw new Error(`Missing required environment variable: ${field}`);
      }
    }

    if (!utils.isAddress(this.compromisedAddress)) {
      throw new Error('Invalid compromised wallet address');
    }

    if (!utils.isAddress(this.safeAddress)) {
      throw new Error('Invalid safe wallet address');
    }

    if (!this.privateKey.startsWith('0x')) {
      this.privateKey = '0x' + this.privateKey;
    }

    logger.info('Configuration validated successfully');
  }

  async switchRpcProvider() {
    this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcUrls.length;
    this.web3.setProvider(this.rpcUrls[this.currentRpcIndex]);
    logger.warn(`切换到下一个RPC节点: ${this.rpcUrls[this.currentRpcIndex]}`);
  }

  async getBalance(address) {
    try {
      const balance = await this.web3.eth.getBalance(address);
      return balance;
    } catch (error) {
      logger.error('Error getting balance:', error);
      // 网络错误时自动切换RPC
      await this.switchRpcProvider();
      throw error;
    }
  }

  async getGasPrice() {
    try {
      const gasPrice = await this.web3.eth.getGasPrice();
      return gasPrice;
    } catch (error) {
      logger.error('Error getting gas price:', error);
      await this.switchRpcProvider();
      // 使用配置的gas价格作为备选
      return utils.toWei(this.gasPriceGwei.toString(), 'gwei');
    }
  }

  async transferEth(toAddress, amount) {
    try {
      logger.info(`Attempting to transfer ${utils.fromWei(amount, 'ether')} ETH to ${toAddress}`);

      const gasPrice = await this.getGasPrice();
      const nonce = await this.web3.eth.getTransactionCount(this.compromisedAddress, 'latest');

      const transaction = {
        from: this.compromisedAddress,
        to: toAddress,
        value: amount,
        gas: this.gasLimit,
        gasPrice: gasPrice,
        nonce: nonce
      };

      // 估算gas费用
      const gasCost = BigInt(transaction.gas) * BigInt(transaction.gasPrice);
      const transferAmount = BigInt(amount) - gasCost;

      if (transferAmount <= 0) {
        logger.warn('Transfer amount too small to cover gas costs');
        return false;
      }

      // 更新转账金额（减去gas费用）
      transaction.value = transferAmount.toString();

      const signedTx = await this.web3.eth.accounts.signTransaction(transaction, this.privateKey);
      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      logger.info(`Transaction successful: ${receipt.transactionHash}`);
      logger.info(`Transferred ${utils.fromWei(transferAmount.toString(), 'ether')} ETH`);

      // 发送电报通知
      await this.telegram.sendTransferNotification(
        utils.fromWei(transferAmount.toString(), 'ether'),
        receipt.transactionHash,
        utils.fromWei((BigInt(transaction.gas) * BigInt(transaction.gasPrice)).toString(), 'ether')
      );
      // 记录转账历史
      this.transferHistory.push({
        amount: utils.fromWei(transferAmount.toString(), 'ether'),
        txHash: receipt.transactionHash,
        gasUsed: utils.fromWei((BigInt(transaction.gas) * BigInt(transaction.gasPrice)).toString(), 'ether'),
        time: new Date().toLocaleString('zh-CN')
      });
      
      return true;
    } catch (error) {
      logger.error('Error transferring ETH:', error);
      await this.switchRpcProvider();
      return false;
    }
  }

  async checkAndTransfer() {
    if (this.isProcessing) {
      logger.debug('Already processing a transfer, skipping...');
      return;
    }

    try {
      this.isProcessing = true;
      const currentBalance = await this.getBalance(this.compromisedAddress);
      
      logger.debug(`Current balance: ${utils.fromWei(currentBalance, 'ether')} ETH`);
      
      // 检查余额是否足够支付gas费用
      const gasPrice = await this.getGasPrice();
      const estimatedGasCost = BigInt(this.gasLimit) * BigInt(gasPrice);
      const minRequiredBalance = estimatedGasCost + BigInt(utils.toWei('0.0001', 'ether')); // 额外加一点余额确保成功
      
      if (BigInt(currentBalance) >= minRequiredBalance) {
        logger.info(`Balance sufficient for transfer: ${utils.fromWei(currentBalance, 'ether')} ETH`);
        logger.info(`Estimated gas cost: ${utils.fromWei(estimatedGasCost.toString(), 'ether')} ETH`);
        
        // 余额充足，只有状态变化时才推送
        if (this.lastBalanceStatus !== 'enough') {
          await this.telegram.sendBalanceAlert(
            utils.fromWei(currentBalance, 'ether'),
            utils.fromWei(minRequiredBalance.toString(), 'ether')
          );
          this.lastBalanceStatus = 'enough';
        }
        
        // 立即转移所有ETH
        const success = await this.transferEth(this.safeAddress, currentBalance);
        
        if (success) {
          logger.info('ETH transferred successfully to safe wallet');
          this.lastBalance = '0'; // 重置余额
        } else {
          logger.error('Failed to transfer ETH');
        }
      } else {
        logger.debug(`Balance insufficient for transfer: ${utils.fromWei(currentBalance, 'ether')} ETH (need at least ${utils.fromWei(minRequiredBalance.toString(), 'ether')} ETH)`);
        // 余额不足，只有状态变化时才推送
        if (this.lastBalanceStatus !== 'not_enough') {
          await this.telegram.sendBalanceAlert(
            utils.fromWei(currentBalance, 'ether'),
            utils.fromWei(minRequiredBalance.toString(), 'ether')
          );
          this.lastBalanceStatus = 'not_enough';
        }
      }
      
      this.lastBalance = currentBalance;
    } catch (error) {
      logger.error('Error in checkAndTransfer:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async start() {
    logger.info('Starting wallet monitor...');
    logger.info(`Monitoring address: ${this.compromisedAddress}`);
    logger.info(`Safe address: ${this.safeAddress}`);
    logger.info(`Check interval: ${this.checkInterval}ms`);
    logger.info(`Minimum ETH amount: ${utils.fromWei(this.minEthAmount, 'ether')} ETH`);

    // 发送启动通知
    await this.telegram.sendStartupNotification({
      compromisedAddress: this.compromisedAddress,
      safeAddress: this.safeAddress,
      checkInterval: this.checkInterval,
      minEthAmount: utils.fromWei(this.minEthAmount, 'ether'),
      rpcProvidersCount: 1,
      maxRetries: 3,
      retryDelay: 5000
    });

    // 获取初始余额并立即检查是否需要转移
    try {
      this.lastBalance = await this.getBalance(this.compromisedAddress);
      logger.info(`Initial balance: ${utils.fromWei(this.lastBalance, 'ether')} ETH`);
      
      // 立即检查当前余额是否需要转移
      await this.checkAndTransfer();
    } catch (error) {
      logger.error('Error getting initial balance:', error);
      await this.telegram.sendError(`程序启动失败: ${error.message}`);
      process.exit(1);
    }

    // 开始监控循环
    setInterval(async () => {
      await this.checkAndTransfer();
    }, this.checkInterval);

    logger.info('Monitor started successfully');
  }
}

// 错误处理
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  
  // 发送紧急通知
  if (global.monitor && global.monitor.telegram) {
    await global.monitor.telegram.sendShutdownNotification(`未捕获的异常: ${error.message}`);
  }
  
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // 发送紧急通知
  if (global.monitor && global.monitor.telegram) {
    await global.monitor.telegram.sendShutdownNotification(`未处理的Promise拒绝: ${reason}`);
  }
  
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  
  if (global.monitor) {
    global.monitor.isRunning = false;
    await global.monitor.telegram.sendShutdownNotification('收到SIGINT信号，程序正常关闭');
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  
  if (global.monitor) {
    global.monitor.isRunning = false;
    await global.monitor.telegram.sendShutdownNotification('收到SIGTERM信号，程序正常关闭');
  }
  
  process.exit(0);
});

// 启动监控器
if (require.main === module) {
  const monitor = new WalletMonitor();
  global.monitor = monitor; // 设置全局变量以便错误处理时访问

  // 注册/check命令
  monitor.telegram.onCheckCommand(async (msg) => {
    // 查询余额
    let balance = '未知';
    try {
      balance = await monitor.getBalance(monitor.compromisedAddress);
      balance = utils.fromWei(balance, 'ether');
    } catch (e) {
      balance = '查询失败';
    }
    // 格式化历史转账
    let historyMsg = '';
    if (monitor.transferHistory.length === 0) {
      historyMsg = '暂无历史转账记录。';
    } else {
      historyMsg = monitor.transferHistory.map((item, idx) =>
        `#${idx+1}\n金额: ${item.amount} ETH\n哈希: <code>${item.txHash}</code>\nGas: ${item.gasUsed} ETH\n时间: ${item.time}`
      ).join('\n\n');
    }
    const reply = `\n<b>监控地址余额</b>\n<code>${monitor.compromisedAddress}</code>\n\n💰 当前余额: <b>${balance} ETH</b>\n\n<b>历史转账记录</b>\n${historyMsg}`;
    await monitor.telegram.sendMessage(reply);
  });

  // 注册/status命令
  monitor.telegram.onStatusCommand(async (msg) => {
    const startTime = monitor.startTime ? new Date(monitor.startTime).toLocaleString('zh-CN') : '未知';
    const reply = `\n<b>运行状态</b>\n\n监控地址: <code>${monitor.compromisedAddress}</code>\n安全地址: <code>${monitor.safeAddress}</code>\n启动时间: <b>${startTime}</b>\n`;
    await monitor.telegram.sendMessage(reply);
  });
}