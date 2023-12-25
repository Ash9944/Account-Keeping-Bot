const TelegramBot = require('node-telegram-bot-api');
const userServices = require('./services/user')
const config = require('./config.json');
var mongoUtil = require('./daos/MongodDbUtil');

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(config.tokenId, { polling: true });
if (!bot) {
  process.exit(0, "Couldn't connect to Telegram Bot")
}

bot.onText(/signup (.+)/, async function onEchoText(msg, match) {
  try {
    if (!msg.chat.id) {
      throw new Error('Error')
    }
    await userServices.signup(match[1],msg);
    bot.sendMessage(msg.chat.id , "Welcome to the TG Account Bot Your Account has been created");
  } catch (error) {
    bot.sendMessage(msg.chat.id,error.message)
  }
});

bot.onText(/update (.+)/, async function onEchoText(msg, match) {
  try {
    if (!msg.chat.id) {
      throw new Error('Error')
    }

    var response = await userServices.update(match[1],msg,bot);
    bot.sendMessage(msg.chat.id, "Updated user");
  } catch (error) {
    bot.sendMessage(msg.chat.id, error.message)
  }
});

bot.onText(/fetchdebit/, async function onEchoText(msg, match) {
  try {
    if (!msg.chat.id) {
      throw new Error('Error')
    }

    var response = await userServices.fetchUserDebitTransactions(msg.chat.id);
    bot.sendMessage(msg.chat.id, response);
  } catch (error) {
    bot.sendMessage(msg.chat.id, error.message)
  }
});

bot.onText(/fetchcredit/, async function onEchoText(msg, match) {
  try {
    if (!msg.chat.id) {
      throw new Error('Error')
    }

    var response = await userServices.fetchUserCreditTransactions(msg.chat.id);
    bot.sendMessage(msg.chat.id, response);
  } catch (error) {
    bot.sendMessage(msg.chat.id, error.message)
  }
});