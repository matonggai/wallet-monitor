# Sepolia测试网配置指南

## 为什么使用Sepolia测试网？

✅ **安全性**: 测试网上的资产没有真实价值，可以安全测试
✅ **免费**: 测试网ETH可以免费获取，无需担心gas费用
✅ **验证**: 可以完整测试脚本功能，确保配置正确
✅ **学习**: 熟悉流程后再切换到主网

## 1. 获取Sepolia测试网ETH

### 方法一：使用Sepolia水龙头
1. 访问 [Sepolia水龙头](https://sepoliafaucet.com/)
2. 输入你的钱包地址
3. 等待几分钟接收测试ETH

### 方法二：使用Alchemy水龙头
1. 访问 [Alchemy Sepolia水龙头](https://sepoliafaucet.com/)
2. 连接钱包或输入地址
3. 获取免费测试ETH

### 方法三：使用Infura水龙头
1. 访问 [Infura Sepolia水龙头](https://www.infura.io/faucet/sepolia)
2. 输入钱包地址
3. 获取测试ETH

## 2. 配置Sepolia测试网

### 创建测试钱包
1. 使用MetaMask创建新钱包（仅用于测试）
2. 或者使用现有的测试钱包
3. 记录钱包地址和私钥

### 配置环境变量
编辑 `.env` 文件：

```env
# Sepolia测试网RPC
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# 测试钱包地址（模拟泄露的钱包）
COMPROMISED_WALLET_ADDRESS=0x你的测试钱包地址

# 安全钱包地址（接收ETH的地址）
SAFE_WALLET_ADDRESS=0x你的安全钱包地址

# 测试钱包的私钥
COMPROMISED_WALLET_PRIVATE_KEY=你的测试钱包私钥

# 测试网配置（更低的阈值）
MIN_ETH_AMOUNT=0.0001
CHECK_INTERVAL=5000
GAS_LIMIT=21000
GAS_PRICE_GWEI=5
```

## 3. 获取Sepolia RPC URL

### 使用Infura
1. 访问 [Infura.io](https://infura.io)
2. 创建新项目
3. 在项目设置中选择Sepolia网络
4. 复制RPC URL

### 使用Alchemy
1. 访问 [Alchemy.com](https://alchemy.com)
2. 创建新应用
3. 选择Sepolia网络
4. 复制HTTP URL

### 使用公共RPC
```env
RPC_URL=https://rpc.sepolia.org
```

## 4. 测试流程

### 步骤1：测试配置
```bash
npm run test-config
```

### 步骤2：启动监控
```bash
npm start
```

### 步骤3：模拟攻击
1. 向泄露钱包地址转入少量测试ETH
2. 观察脚本是否立即转移ETH
3. 检查安全钱包是否收到ETH

## 5. 测试网与主网的区别

| 项目 | Sepolia测试网 | 主网 |
|------|---------------|------|
| 资产价值 | 无价值 | 真实价值 |
| Gas费用 | 免费 | 需要支付 |
| 网络稳定性 | 可能不稳定 | 稳定 |
| 区块确认 | 较快 | 正常速度 |
| 水龙头 | 可用 | 不可用 |

## 6. 切换到主网

测试完成后，修改 `.env` 文件：

```env
# 主网RPC
RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID

# 真实钱包地址
COMPROMISED_WALLET_ADDRESS=0x真实泄露钱包地址
SAFE_WALLET_ADDRESS=0x真实安全钱包地址
COMPROMISED_WALLET_PRIVATE_KEY=真实私钥

# 主网配置
MIN_ETH_AMOUNT=0.001
CHECK_INTERVAL=10000
GAS_LIMIT=21000
GAS_PRICE_GWEI=20
```

## 7. 安全提醒

⚠️ **重要安全注意事项**：

1. **测试钱包**: 使用专门的钱包进行测试，不要使用主网钱包
2. **私钥安全**: 测试完成后删除测试钱包的私钥
3. **环境隔离**: 测试环境和生产环境使用不同的配置文件
4. **备份**: 测试前备份重要数据

## 8. 故障排除

### 常见问题

1. **无法获取测试ETH**
   - 尝试不同的水龙头
   - 检查钱包地址是否正确

2. **RPC连接失败**
   - 检查网络连接
   - 验证RPC URL格式

3. **交易失败**
   - 检查gas价格设置
   - 确认钱包有足够ETH支付gas

4. **余额检测不准确**
   - 增加检查间隔时间
   - 检查网络延迟 