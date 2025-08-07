#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupTelegram() {
  console.log('🤖 电报机器人快速设置向导');
  console.log('================================\n');

  console.log('📋 设置步骤：');
  console.log('1. 创建电报机器人');
  console.log('2. 获取Chat ID');
  console.log('3. 配置环境变量');
  console.log('4. 测试配置\n');

  const botToken = await question('请输入您的机器人Token: ');
  const chatId = await question('请输入您的Chat ID: ');

  if (!botToken || !chatId) {
    console.log('❌ Token或Chat ID不能为空');
    rl.close();
    return;
  }

  // 检查.env文件是否存在
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // 检查是否已经有电报配置
  if (envContent.includes('TELEGRAM_BOT_TOKEN')) {
    console.log('⚠️  检测到已存在的电报配置');
    const overwrite = await question('是否要覆盖现有配置？(y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ 设置已取消');
      rl.close();
      return;
    }

    // 移除现有的电报配置
    envContent = envContent
      .split('\n')
      .filter(line => !line.startsWith('TELEGRAM_'))
      .join('\n');
  }

  // 添加电报配置
  const telegramConfig = `
# 电报机器人配置
TELEGRAM_BOT_TOKEN=${botToken}
TELEGRAM_CHAT_ID=${chatId}`;

  envContent += telegramConfig;

  // 写入.env文件
  fs.writeFileSync(envPath, envContent);

  console.log('✅ 环境变量配置完成');
  console.log('📤 正在测试配置...\n');

  // 测试配置
  try {
    process.env.TELEGRAM_BOT_TOKEN = botToken;
    process.env.TELEGRAM_CHAT_ID = chatId;

    const TelegramNotifier = require('../src/telegram-bot');
    const notifier = new TelegramNotifier();

    if (!notifier.isEnabled) {
      console.log('❌ 电报机器人初始化失败');
      console.log('请检查Token和Chat ID是否正确');
      rl.close();
      return;
    }

    const success = await notifier.sendTestMessage();
    
    if (success) {
      console.log('✅ 配置测试成功！');
      console.log('📱 请检查您的电报，应该收到一条测试消息');
      console.log('\n🎉 电报机器人设置完成！');
      console.log('\n📋 接下来您可以：');
      console.log('  1. 运行 npm start 启动监控程序');
      console.log('  2. 运行 npm run test-telegram 再次测试');
      console.log('  3. 查看 TELEGRAM_SETUP.md 了解更多功能');
    } else {
      console.log('❌ 测试消息发送失败');
      console.log('请检查：');
      console.log('  1. 机器人Token是否正确');
      console.log('  2. Chat ID是否正确');
      console.log('  3. 是否向机器人发送了 /start');
    }
  } catch (error) {
    console.log('❌ 测试过程中发生错误：');
    console.log(error.message);
    console.log('\n🔧 请检查配置并重新运行此脚本');
  }

  rl.close();
}

// 运行设置
setupTelegram().catch(error => {
  console.error('❌ 设置过程中发生错误：', error);
  process.exit(1);
}); 