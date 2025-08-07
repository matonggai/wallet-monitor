const { Web3, utils } = require('web3');
require('dotenv').config();

async function sepoliaTest() {
  console.log('🧪 Sepolia测试网配置测试\n');

  // 检查是否为Sepolia网络
  try {
    const web3 = new Web3(process.env.RPC_URL);
    const networkId = await web3.eth.net.getId();
    
    if (networkId != 11155111) {
      console.log('❌ 错误: 当前不是Sepolia测试网！');
      console.log(`当前网络ID: ${networkId}`);
      console.log('请确保RPC_URL指向Sepolia测试网');
      return;
    }
    
    console.log('✅ 确认连接到Sepolia测试网');
  } catch (error) {
    console.log('❌ 无法连接到网络:', error.message);
    return;
  }

  // 测试钱包地址
  const testWallet = process.env.COMPROMISED_WALLET_ADDRESS;
  const safeWallet = process.env.SAFE_WALLET_ADDRESS;

  console.log('\n📋 钱包地址检查:');
  console.log(`测试钱包: ${testWallet}`);
  console.log(`安全钱包: ${safeWallet}`);

  if (!utils.isAddress(testWallet) || !utils.isAddress(safeWallet)) {
    console.log('❌ 钱包地址格式错误');
    return;
  }

  // 检查余额
  try {
    const web3 = new Web3(process.env.RPC_URL);
    const balance = await web3.eth.getBalance(testWallet);
    const balanceEth = utils.fromWei(balance, 'ether');
    
    console.log(`\n💰 测试钱包余额: ${balanceEth} ETH`);
    
    if (parseFloat(balanceEth) === 0) {
      console.log('⚠️  测试钱包余额为0，需要获取测试ETH');
      console.log('\n获取测试ETH的方法:');
      console.log('1. 访问 https://sepoliafaucet.com/');
      console.log('2. 输入钱包地址: ' + testWallet);
      console.log('3. 等待几分钟接收测试ETH');
    } else {
      console.log('✅ 测试钱包有余额，可以开始测试');
    }
  } catch (error) {
    console.log('❌ 无法获取余额:', error.message);
  }

  // 测试配置参数
  console.log('\n⚙️  测试网配置参数:');
  console.log(`最小ETH数量: ${process.env.MIN_ETH_AMOUNT || '0.0001'} ETH`);
  console.log(`检查间隔: ${process.env.CHECK_INTERVAL || '5000'} ms`);
  console.log(`Gas价格: ${process.env.GAS_PRICE_GWEI || '5'} Gwei`);

  console.log('\n🎯 Sepolia测试网配置检查完成!');
  console.log('\n下一步:');
  console.log('1. 如果余额为0，先获取测试ETH');
  console.log('2. 运行 "npm start" 启动监控');
  console.log('3. 向测试钱包转入少量ETH测试功能');
}

sepoliaTest().catch(console.error); 