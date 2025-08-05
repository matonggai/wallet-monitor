const { Web3, utils } = require('web3');
require('dotenv').config();

async function testConfig() {
  console.log('🔍 测试钱包监控配置...\n');

  // 检查环境变量
  console.log('📋 环境变量检查:');
  const requiredVars = [
    'RPC_URL',
    'COMPROMISED_WALLET_ADDRESS',
    'SAFE_WALLET_ADDRESS',
    'COMPROMISED_WALLET_PRIVATE_KEY'
  ];

  let allVarsPresent = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName.includes('PRIVATE_KEY') ? '***已设置***' : value}`);
    } else {
      console.log(`❌ ${varName}: 未设置`);
      allVarsPresent = false;
    }
  }

  if (!allVarsPresent) {
    console.log('\n❌ 请检查 .env 文件，确保所有必需的环境变量都已设置');
    return;
  }

  console.log('\n🌐 网络连接测试:');
  try {
    const web3 = new Web3(process.env.RPC_URL);
    const blockNumber = await web3.eth.getBlockNumber();
    const networkId = await web3.eth.net.getId();
    
    console.log(`✅ RPC连接成功，当前区块: ${blockNumber}`);
    
    // 检查网络类型
    if (networkId === 1) {
      console.log('⚠️  警告: 检测到主网连接！建议先在测试网上测试');
    } else if (networkId === 11155111) {
      console.log('✅ 检测到Sepolia测试网连接');
    } else if (networkId === 5) {
      console.log('✅ 检测到Goerli测试网连接');
    } else {
      console.log(`ℹ️  网络ID: ${networkId} (未知网络)`);
    }
  } catch (error) {
    console.log(`❌ RPC连接失败: ${error.message}`);
    return;
  }

  console.log('\n👛 钱包地址验证:');
  const compromisedAddress = process.env.COMPROMISED_WALLET_ADDRESS;
  const safeAddress = process.env.SAFE_WALLET_ADDRESS;

  if (utils.isAddress(compromisedAddress)) {
    console.log(`✅ 泄露钱包地址有效: ${compromisedAddress}`);
  } else {
    console.log(`❌ 泄露钱包地址无效: ${compromisedAddress}`);
  }

  if (utils.isAddress(safeAddress)) {
    console.log(`✅ 安全钱包地址有效: ${safeAddress}`);
  } else {
    console.log(`❌ 安全钱包地址无效: ${safeAddress}`);
  }

  console.log('\n💰 余额检查:');
  try {
    const web3 = new Web3(process.env.RPC_URL);
    const balance = await web3.eth.getBalance(compromisedAddress);
    const balanceEth = utils.fromWei(balance, 'ether');
    console.log(`📊 泄露钱包当前余额: ${balanceEth} ETH`);
    
    if (parseFloat(balanceEth) > 0) {
      console.log('⚠️  警告: 泄露钱包中仍有ETH，建议立即转移');
    } else {
      console.log('✅ 泄露钱包余额为0，可以开始监控');
    }
  } catch (error) {
    console.log(`❌ 无法获取余额: ${error.message}`);
  }

  console.log('\n⚙️  配置参数:');
  console.log(`📊 最小ETH数量: ${process.env.MIN_ETH_AMOUNT || '0.001'} ETH`);
  console.log(`⏱️  检查间隔: ${process.env.CHECK_INTERVAL || '10000'} ms`);
  console.log(`⛽ Gas限制: ${process.env.GAS_LIMIT || '21000'}`);
  console.log(`💰 Gas价格: ${process.env.GAS_PRICE_GWEI || '20'} Gwei`);

  console.log('\n🎯 测试完成!');
  console.log('如果所有检查都通过，可以运行 "npm start" 启动监控');
}

testConfig().catch(console.error); 