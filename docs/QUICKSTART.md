# 快速启动指南

## 1. 安装依赖

```bash
npm install
```

## 2. 配置环境变量

复制环境变量模板：

```bash
cp env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
# 以太坊网络配置（推荐使用Infura）
RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID

# 泄露的钱包地址
COMPROMISED_WALLET_ADDRESS=0x你的泄露钱包地址

# 安全钱包地址（接收ETH的地址）
SAFE_WALLET_ADDRESS=0x你的安全钱包地址

# 泄露钱包的私钥（用于签名转移交易）
COMPROMISED_WALLET_PRIVATE_KEY=你的私钥
```

## 3. 测试配置

运行配置测试：

```bash
npm run test-config
```

确保所有检查都通过。

## 4. 启动监控

```bash
npm start
```

## 重要提醒

⚠️ **安全注意事项**：

1. **私钥安全**: 确保 `.env` 文件不会被提交到Git
2. **测试网络**: 建议先在Goerli测试网上测试
3. **备份**: 定期备份安全钱包的私钥
4. **监控**: 持续监控脚本运行状态

## 获取Infura项目ID

1. 访问 [Infura.io](https://infura.io)
2. 注册账户并创建新项目
3. 复制项目ID到RPC_URL中

## 获取钱包私钥

如果你有助记词，可以使用以下方法获取私钥：

1. 使用MetaMask导入助记词
2. 在账户详情中导出私钥
3. 或者使用BIP39工具从助记词生成私钥

## 故障排除

如果遇到问题：

1. 检查网络连接
2. 验证钱包地址格式
3. 确认私钥正确
4. 查看日志文件获取详细错误信息 