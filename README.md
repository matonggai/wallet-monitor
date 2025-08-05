# 钱包监控脚本

这是一个用于监控泄露钱包地址的脚本，一旦检测到ETH转入，立即将ETH转移到安全地址。

## 功能特性

- 🔍 实时监控指定钱包地址的ETH余额变化
- ⚡ 检测到ETH转入后立即转移
- 💰 自动计算gas费用，确保转移成功
- 📝 详细的日志记录
- 🛡️ 错误处理和重试机制
- ⚙️ 可配置的监控参数

## 安装

1. 克隆或下载项目文件
2. 安装依赖：

```bash
npm install
```

## 配置

1. 复制环境变量示例文件：

```bash
cp env.example .env
```

2. 编辑 `.env` 文件，配置以下参数：

```env
# 以太坊网络配置
RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID

# 泄露的钱包地址（需要监控的地址）
COMPROMISED_WALLET_ADDRESS=0x0000000000000000000000000000000000000000

# 安全钱包地址（转移ETH的目标地址）
SAFE_WALLET_ADDRESS=0x0000000000000000000000000000000000000000

# 泄露钱包的私钥（用于签名交易）
COMPROMISED_WALLET_PRIVATE_KEY=your_private_key_here

# 监控配置
MIN_ETH_AMOUNT=0.001
CHECK_INTERVAL=10000
GAS_LIMIT=21000
GAS_PRICE_GWEI=20
```

### 配置说明

- `RPC_URL`: 以太坊网络RPC地址（推荐使用Infura）
- `COMPROMISED_WALLET_ADDRESS`: 需要监控的泄露钱包地址
- `SAFE_WALLET_ADDRESS`: 安全钱包地址，ETH将被转移到这里
- `COMPROMISED_WALLET_PRIVATE_KEY`: 泄露钱包的私钥（用于签名转移交易）
- `MIN_ETH_AMOUNT`: 最小触发转移的ETH数量（单位：ETH）
- `CHECK_INTERVAL`: 检查间隔（毫秒）
- `GAS_LIMIT`: Gas限制
- `GAS_PRICE_GWEI`: Gas价格（Gwei）

## 使用方法

### 启动监控

```bash
npm start
```

### 开发模式（自动重启）

```bash
npm run dev
```

## 工作原理

1. **监控循环**: 脚本每10秒检查一次钱包余额
2. **余额检测**: 比较当前余额与上次记录的余额
3. **触发条件**: 当检测到ETH余额增加且超过最小阈值时触发转移
4. **自动转移**: 立即将钱包中的所有ETH转移到安全地址
5. **Gas计算**: 自动计算gas费用，确保转移成功

## 安全注意事项

⚠️ **重要安全提醒**:

1. **私钥安全**: 确保 `.env` 文件安全，不要将私钥提交到版本控制系统
2. **网络选择**: 建议先在测试网（如Goerli）上测试
3. **备份**: 定期备份安全钱包的私钥
4. **监控**: 持续监控脚本运行状态和日志

## 日志

脚本会生成以下日志文件：

- `combined.log`: 所有日志记录
- `error.log`: 仅错误日志
- 控制台输出: 实时日志显示

## 故障排除

### 常见问题

1. **RPC连接失败**
   - 检查网络连接
   - 验证RPC URL是否正确
   - 确认Infura项目ID有效

2. **交易失败**
   - 检查gas价格设置
   - 确认钱包有足够的ETH支付gas
   - 验证私钥格式

3. **余额检测不准确**
   - 调整 `CHECK_INTERVAL` 参数
   - 检查网络延迟

### 调试模式

设置环境变量 `LOG_LEVEL=debug` 获取更详细的日志信息。

## 许可证

MIT License

## 免责声明

此脚本仅用于教育目的。使用前请充分了解风险，作者不对使用此脚本造成的任何损失负责。 