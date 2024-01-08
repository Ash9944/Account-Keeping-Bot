import * as TelegramBot from 'node-telegram-bot-api';
import * as userServices from './services/user';
import { tokenId } from './config.json';
import * as mongo from './daos/mongoDbUtil';

mongo.connect();
const bot = new TelegramBot(tokenId, { polling: true });

bot.onText(/start/, async function onEchoText(msg) {
    try {
        if (!msg.chat.id) {
            throw new Error('Error')
        }

        await userServices.signup(msg);
        bot.sendMessage(msg.chat.id, "Welcome to the Mayhem Project Your Account has been created here !");
    } catch (error: any) {
        bot.sendMessage(msg.chat.id, error.message)
    }
});

bot.onText(/update/, async function onEchoText(msg) {
    try {
        if (!msg.chat.id) {
            throw new Error('Error')
        }

        await userServices.update(msg, bot);

    } catch (error: any) {
        bot.sendMessage(msg.chat.id, error.message)
    }
});

bot.onText(/fetchdebit/, async function onEchoText(msg) {
    try {
        if (!msg.chat.id) {
            throw new Error('Error')
        }

        var response: string = await userServices.fetchUserDebit(msg.chat.id);
        bot.sendMessage(msg.chat.id, response);
    } catch (error: any) {
        bot.sendMessage(msg.chat.id, error.message)
    }
});

bot.onText(/fetchcredit/, async function onEchoText(msg) {
    try {
        if (!msg.chat.id) {
            throw new Error('Error')
        }

        var response: string = await userServices.fetchUserCredit(msg.chat.id);
        bot.sendMessage(msg.chat.id, response);
    } catch (error: any) {
        bot.sendMessage(msg.chat.id, error.message)
    }
});

bot.onText(/creditdetails/, async function onEchoText(msg) {
    try {
        if (!msg.chat.id) {
            throw new Error('Error')
        }
        await userServices.fetchUserCreditTransactions(msg, bot);
    } catch (error: any) {
        bot.sendMessage(msg.chat.id, error.message)
    }
});

bot.onText(/debitdetails/, async function onEchoText(msg) {
    try {
        if (!msg.chat.id) {
            throw new Error('Error')
        }
        await userServices.fetchUserDebitTransactions(msg, bot);
    } catch (error: any) {
        bot.sendMessage(msg.chat.id, error.message)
    }
});
