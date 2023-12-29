var userDao = require('../daos/base')('users');
var transactiondao = require('../daos/base')('transactions');
var moment = require('moment');

async function singnup(details) {
    try {
        if (!details.chat.id) {
            throw new Error('User Details Missing');
        }

        let isExist = await isExistUser(details.chat.id);
        if (isExist) {
            throw new Error('User already exists');
        }

        let isExistInDevice = await userDao.count({ 'chatId': details.chat.id });
        if (isExistInDevice) {
            throw new Error('This Device Already Has a user');
        }

        let user = {
            "name": details.chat.first_name,
            "chatId": details.chat.id,
            "createdOn": new Date()
        }

        let createResponse = await userDao.create(user);
        return Promise.resolve(createResponse);
    } catch (error) {
        return Promise.reject(error);
    }
}

async function update(updaterDetails, bot) {
    try {

        let updaterUser = await userDao.getOne({ "chatId": updaterDetails.chat.id });
        if (!updaterUser) {
            throw new Error('You Are Not Signed up');
        }
        let users = await userDao.getBy({ "chatId": { "$ne": updaterDetails.chat.id } });
        let buttons = users.map(item => { return { text: item.name, callback_data: item.chatId } });
        const keyboard = {
            inline_keyboard: [
                buttons
            ]
        };
        // Send a message with the inline keyboard
        bot.sendMessage(updaterDetails.chat.id, 'Choose a user to update amount:', { reply_markup: keyboard });

        let result = await listencallbackQueries(bot, updaterDetails.chat, users);

        let userToupdate = await userDao.getOne({ "chatId": parseInt(result.data) })

        bot.sendMessage(updaterDetails.chat.id, `To update ${userToupdate.name} type : amount,reason\nEg : 2000,Restaurant split`);

        let amountResp = await listenMessages(bot, updaterDetails.chat);

        var arr = amountResp.text.split(',')
        if (!arr.length) {
            throw new Error('No parameters given for update')
        }

        var amount = parseInt(arr[0]);
        if (isNaN(amount) || !arr[0]) {
            throw new Error("Not a Proper Format For Update Amount")
        }

        var reason = arr[1];
        if (!reason) {
            throw new Error("No reason Found");
        }

        var transactionDetail = {
            "transactedOn": new Date(),
            "updatedBy": updaterUser,
            "updatedAmount": amount,
            "description": reason,
            'updatedFor': userToupdate
        }
        await transactiondao.create(transactionDetail);

        var outstandingAmountPipeline = [
            {
                "$match": { "updatedBy.chatId": updaterUser.chatId, 'updatedFor.chatId': userToupdate.chatId }
            },
            {
                "$group": {
                    "_id": null,
                    "outstandingAmount": { $sum: '$updatedAmount' },
                    "count": { $sum: 1 }
                }
            }
        ]
        var outstandingAmount = await transactiondao.aggregate(outstandingAmountPipeline);
        if (!outstandingAmount.length) {
            throw new Error('No transactions Made Yet')
        }

        bot.sendMessage(userToupdate.chatId, `Your outstanding amount to ${updaterDetails.from.first_name} Is ${outstandingAmount[0].outstandingAmount} \n You Have been Updated ${amount} for ${reason} on ${moment(transactionDetail.transactedOn).format('DD/MM/YYYY')}`)

    } catch (error) {
        return Promise.reject(error);
    }
}

async function isExistUser(userId) {
    var isExist = await userDao.count({ 'chatId': userId })
    if (isExist) {
        return Promise.resolve(true);
    }
    return Promise.resolve(false);
}

async function fetchUserCredit(chatId) {
    try {
        let msg = "";
        let user = await userDao.getOne({ "chatId": chatId });
        if (!user) {
            throw new Error('User Not found');
        }

        var outstandingAmountPipeline = [
            {
                "$match": { "updatedBy.chatId": user.chatId }
            },
            {
                "$group": {
                    "_id": { "userId": "$updatedFor.chatId", "name": "$updatedFor.name" },
                    "outstandingAmount": { $sum: '$updatedAmount' },
                    "count": { $sum: 1 }
                }
            }
        ]
        var outstandingAmount = await transactiondao.aggregate(outstandingAmountPipeline);
        if (!outstandingAmount.length) {
            throw new Error('No transactions Made Yet')
        }

        for (let i = 0; i < outstandingAmount.length; i++) {
            let userName = await userDao.getOne({ "chatId": outstandingAmount[i]._id.userId });
            msg += `${userName.name} has to pay you ${outstandingAmount[i].outstandingAmount}\n`
        }

        return Promise.resolve(msg);
    } catch (error) {
        return Promise.reject(error);
    }
}

async function fetchUserDebit(chatId) {
    try {
        let msg = "";
        let user = await userDao.getOne({ "chatId": chatId });
        if (!user) {
            throw new Error('User Not found');
        }

        var outstandingAmountPipeline = [
            {
                "$match": { "updatedFor.chatId": chatId }
            },
            {
                "$group": {
                    "_id": { "userId": "$updatedBy.chatId", "name": "$updatedBy.name" },
                    "outstandingAmount": { $sum: '$updatedAmount' },
                    "count": { $sum: 1 }
                }
            }
        ]
        var outstandingAmount = await transactiondao.aggregate(outstandingAmountPipeline);
        if (!outstandingAmount.length) {
            throw new Error('No transactions Made Yet')
        }

        for (let i = 0; i < outstandingAmount.length; i++) {
            msg += `you have to pay ${outstandingAmount[i].outstandingAmount} to ${outstandingAmount[i]._id.name}\n`
        }

        return Promise.resolve(msg);
    } catch (error) {
        return Promise.reject(error);
    }
}

function listencallbackQueries(bot, chatId) {
    return new Promise((resolve, reject) => {
        bot.on('callback_query', (msg) => {
            if (msg.from.id === chatId.id) {
                return resolve(msg);
            }
        })
    })
}

function listenMessages(bot, chatId) {
    return new Promise((resolve, reject) => {
        bot.on('message', (msg) => {
            if (msg.from.id === chatId.id) {
                return resolve(msg);
            }
        })
    })
}

async function fetchUserCreditTransactions(details,bot){
    try {

        let user = await userDao.getOne({ "chatId": details.chat.id });
        if (!user) {
            throw new Error('User Not found');
        }

        let users = await userDao.getBy({ "chatId": { "$ne": user.chatId } });
        let buttons = users.map(item => { return { text: item.name, callback_data: item.chatId } });
        const keyboard = {
            inline_keyboard: [
                buttons
            ]
        };
        // Send a message with the inline keyboard
        bot.sendMessage(details.chat.id, 'Choose a user to check credit amount:', { reply_markup: keyboard });

        let result = await listencallbackQueries(bot, details.chat, users);
        let userToupdate = await userDao.getOne({ "chatId": parseInt(result.data) })
        var outstandingAmountPipeline = [
            {
                "$match": { "updatedBy.chatId": details.chat.id, "updatedFor.chatId": parseInt(result.data) }
            },
            {
                "$sort" : {"_id" : -1}
            },
            {
                "$group": {
                    "_id": null,
                    "outstandingAmount": { $sum: '$updatedAmount' },
                    "details" : {'$push' :"$$ROOT"},
                    "count": { $sum: 1 }
                }
            }
        ]
        var outstandingAmount = await transactiondao.aggregate(outstandingAmountPipeline);
        var msg = `The Credit amount Details of ${userToupdate.name}:\nTotal Amount To pay you: ${outstandingAmount[0].outstandingAmount}\n`;
        for(var i = 0; i < outstandingAmount[0].details.length; i++){
            msg += `${moment(outstandingAmount[0].details[i].transactedOn).format("DD/MMM HH:mm")} - ${outstandingAmount[0].details[i].updatedAmount} For ${outstandingAmount[0].details[i].description} \n`
        }
        bot.sendMessage(details.chat.id, msg);

    } catch (error) {

    }
}

module.exports.signup = singnup;
module.exports.update = update;
module.exports.fetchUserDebit = fetchUserDebit;
module.exports.fetchUserCredit = fetchUserCredit;
module.exports.fetchUserCreditTransactions = fetchUserCreditTransactions;