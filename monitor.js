const { Web3, utils } = require('web3');
const winston = require('winston');
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
    this.web3 = new Web3(process.env.RPC_URL);
    this.compromisedAddress = process.env.COMPROMISED_WALLET_ADDRESS;
    this.safeAddress = process.env.SAFE_WALLET_ADDRESS;
    this.privateKey = process.env.COMPROMISED_WALLET_PRIVATE_KEY;
    this.minEthAmount = utils.toWei(process.env.MIN_ETH_AMOUNT || '0.001', 'ether');
    this.checkInterval = parseInt(process.env.CHECK_INTERVAL) || 10000;
    this.gasLimit = parseInt(process.env.GAS_LIMIT) || 21000;
    this.gasPriceGwei = parseInt(process.env.GAS_PRICE_GWEI) || 20;
    
    this.lastBalance = '0';
    this.isProcessing = false;
    
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

  async getBalance(address) {
    try {
      const balance = await this.web3.eth.getBalance(address);
      return balance;
    } catch (error) {
      logger.error('Error getting balance:', error);
      throw error;
    }
  }

  async getGasPrice() {
    try {
      const gasPrice = await this.web3.eth.getGasPrice();
      return gasPrice;
    } catch (error) {
      logger.error('Error getting gas price:', error);
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
      
      return true;
    } catch (error) {
      logger.error('Error transferring ETH:', error);
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

    // 获取初始余额并立即检查是否需要转移
    try {
      this.lastBalance = await this.getBalance(this.compromisedAddress);
      logger.info(`Initial balance: ${utils.fromWei(this.lastBalance, 'ether')} ETH`);
      
      // 立即检查当前余额是否需要转移
      await this.checkAndTransfer();
    } catch (error) {
      logger.error('Error getting initial balance:', error);
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
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// 启动监控器
if (require.main === module) {
  const monitor = new WalletMonitor();
  monitor.start().catch(error => {
    logger.error('Failed to start monitor:', error);
    process.exit(1);
  });
}

module.exports = WalletMonitor; 