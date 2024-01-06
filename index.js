const TelegramBot = require('node-telegram-bot-api');
const userServices = require('./services/user')
const config = require('./config.json');
var mongoUtil = require('./daos/MongodDbUtil');
var appLogger = require('./logging/appLogger')

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(config.tokenId, { polling: true });
if (!bot) {
  process.exit(0, "Couldn't connect to Telegram Bot")
}

bot.onText(/start/, async function onEchoText(msg) {
  try {
    if (!msg.chat.id) {
      throw new Error('Error')
    }

    await userServices.signup(msg);
    bot.sendMessage(msg.chat.id, "Welcome to the TG Account Bot Your Account has been created");
    appLogger.info("User Has been Signed in", JSON.stringify(msg))
  } catch (error) {
    bot.sendMessage(msg.chat.id, error.message)
    appLogger.error("User  Sign in error", JSON.stringify(error))
  }
});

bot.onText(/update/, async function onEchoText(msg) {
  try {
    if (!msg.chat.id) {
      throw new Error('Error')
    }

    await userServices.update(msg, bot);
    appLogger.info("Sucessfully updated user", JSON.stringify(msg))
  } catch (error) {
    bot.sendMessage(msg.chat.id, error.message)
    appLogger.error("update error", JSON.stringify(error))
  }
});

bot.onText(/fetchdebit/, async function onEchoText(msg) {
  try {
    if (!msg.chat.id) {
      throw new Error('Error')
    }

    var response = await userServices.fetchUserDebit(msg.chat.id);
    bot.sendMessage(msg.chat.id, response);
    appLogger.info("Sucessfully fetched debit summary", JSON.stringify(msg))
  } catch (error) {
    bot.sendMessage(msg.chat.id, error.message)
    appLogger.error("fetch debit summary error", JSON.stringify(error))
  }
});

bot.onText(/fetchcredit/, async function onEchoText(msg) {
  try {
    if (!msg.chat.id) {
      throw new Error('Error')
    }

    var response = await userServices.fetchUserCredit(msg.chat.id);
    bot.sendMessage(msg.chat.id, response);
    appLogger.info("Sucessfully fetched credit summary", JSON.stringify(msg))
  } catch (error) {
    bot.sendMessage(msg.chat.id, error.message)
    appLogger.error("fetch credit summary error", JSON.stringify(error))
  }
});

bot.onText(/creditdetails/, async function onEchoText(msg) {
  try {
    if (!msg.chat.id) {
      throw new Error('Error')
    }
    await userServices.fetchUserCreditTransactions(msg,bot);
    appLogger.info("Sucessfully fetched credit detailed version", JSON.stringify(msg))
  } catch (error) {
    bot.sendMessage(msg.chat.id, error.message)
    appLogger.error("fetch credit detailed version error", JSON.stringify(error))
  }
});

bot.onText(/debitdetails/, async function onEchoText(msg) {
  try {
    if (!msg.chat.id) {
      throw new Error('Error')
    }
    await userServices.fetchUserDebitTransactions(msg, bot);
    appLogger.info("Sucessfully fetched debit detailed version", JSON.stringify(msg))
  } catch (error) {
    bot.sendMessage(msg.chat.id, error.message)
    appLogger.error("fetch debit detailed version error", JSON.stringify(error))
  }
});
