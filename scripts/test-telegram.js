#!/usr/bin/env node
require('dotenv').config()


const TelegramNotifier = require('../src/telegram-bot');

async function testTelegramBot() {
  console.log('🧪 测试电报机器人配置...\n');

  const notifier = new TelegramNotifier();

  if (!notifier.isEnabled) {
    console.log('❌ 电报机器人未配置');
    console.log('请设置以下环境变量：');
    console.log('  TELEGRAM_BOT_TOKEN=your_bot_token');
    console.log('  TELEGRAM_CHAT_ID=your_chat_id');
    console.log('\n📖 详细设置请参考: TELEGRAM_SETUP.md');
    process.exit(1);
  }

  console.log('✅ 电报机器人已配置');
  console.log('📤 发送测试消息...\n');

  try {
    const success = await notifier.sendTestMessage();
    
    if (success) {
      console.log('✅ 测试消息发送成功！');
      console.log('📱 请检查您的电报，应该收到一条测试消息');
    } else {
      console.log('❌ 测试消息发送失败');
      console.log('请检查：');
      console.log('  1. 机器人Token是否正确');
      console.log('  2. Chat ID是否正确');
      console.log('  3. 是否向机器人发送了 /start');
    }
  } catch (error) {
    console.log('❌ 发送测试消息时出错：');
    console.log(error.message);
    console.log('\n🔧 故障排除：');
    console.log('  1. 检查网络连接');
    console.log('  2. 验证机器人Token');
    console.log('  3. 确认Chat ID');
  }

  console.log('\n📋 测试其他通知类型...\n');

  // 测试不同类型的通知
  const tests = [
    {
      name: '信息通知',
      func: () => notifier.sendInfo('这是一条测试信息通知')
    },
    {
      name: '成功通知',
      func: () => notifier.sendSuccess('这是一条测试成功通知')
    },
    {
      name: '警告通知',
      func: () => notifier.sendAlert('这是一条测试警告通知')
    },
    {
      name: '错误通知',
      func: () => notifier.sendError('这是一条测试错误通知')
    }
  ];

  for (const test of tests) {
    try {
      console.log(`📤 发送${test.name}...`);
      await test.func();
      console.log(`✅ ${test.name}发送成功`);
    } catch (error) {
      console.log(`❌ ${test.name}发送失败: ${error.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
  }

  console.log('\n🎉 测试完成！');
  console.log('📱 请检查您的电报，应该收到多条测试消息');
  console.log('\n💡 提示：');
  console.log('  - 如果收到所有消息，说明配置正确');
  console.log('  - 如果部分消息失败，请检查网络连接');
  console.log('  - 如果完全收不到消息，请重新检查配置');
}

// 运行测试
testTelegramBot().catch(error => {
  console.error('❌ 测试过程中发生错误：', error);
  process.exit(1);
}); 