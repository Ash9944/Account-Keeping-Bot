var userDao = require('../daos/base')('users');
var transactiondao = require('../daos/base')('transactions');

async function singnup(userId, details) {
    try {
        if (!details.chat.id) {
            throw new Error('User Details Missing');
        }

        let isExist = await isExistUser(userId);
        if (isExist) {
            throw new Error('User already exists');
        }

        let isExistInDevice = await userDao.count({ 'chatId': details.chat.id });
        if (isExistInDevice) {
            throw new Error('This Device Already Has a user');
        }

        let user = {
            "name": details.chat.first_name,
            "userId": userId,
            "chatId": details.chat.id,
            "createdOn": new Date()
        }

        let createResponse = await userDao.create(user);
        return Promise.resolve(createResponse);
    } catch (error) {
        return Promise.reject(error);
    }
}

async function update(parameters, updaterDetails, bot) {
    try {
        var arr = parameters.split(',')
        if (!arr.length) {
            throw new Error('No parameters given for update')
        }

        var userId = arr[0];
        let user = await userDao.getOne({ "userId": userId });
        if (!user) {
            throw new Error('User Not found');
        }

        let updaterUser = await userDao.getOne({"chatId": updaterDetails.chat.id});
        if (!updaterUser) {
            throw new Error('You Are Not Signed up');
        }

        var amount = parseInt(arr[1]);
        if (isNaN(amount) || !arr[1]) {
            throw new Error("Not a Proper Format For Update Amount")
        }

        var reason = arr[2];
        if (!arr[2]) {
            throw new Error("No reason Found");
        }

        var transactionDetail = {
            "transactedOn": new Date(),
            "updatedBy": updaterUser.userId,
            "updaterDetails": updaterDetails.from,
            "updatedAmount": amount,
            "description": reason,
            'updatedFor': user.userId
        }
        await transactiondao.create(transactionDetail);

        var outstandingAmountPipeline = [
            {
                "$match": {"updatedBy" : updaterUser.userId}
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

        bot.sendMessage(user.chatId, `Your outstanding amount to ${updaterDetails.from.first_name} Is ${outstandingAmount[0].outstandingAmount} \n You Have been Updated ${amount} for ${reason} on ${transactionDetail.transactedOn}`)

    } catch (error) {
        return Promise.reject(error);
    }
}

async function isExistUser(userId) {
    var isExist = await userDao.count({ 'userId': userId })
    if (isExist) {
        return Promise.resolve(true);
    }
    return Promise.resolve(false);
}

async function fetchUserCreditTransactions(chatId) {
    try {
        let msg = "";
        let user = await userDao.getOne({ "chatId": chatId });
        if (!user) {
            throw new Error('User Not found');
        }

        var outstandingAmountPipeline = [
            {
                "$match": { "updatedBy": user.userId }
            },
            {
                "$group": {
                    "_id": { "userId": "$updatedFor", "name": "$updaterDetails.first_name"},
                    "outstandingAmount": { $sum: '$updatedFor' },
                    "count": { $sum: 1 }
                }
            }
        ]
        var outstandingAmount = await transactiondao.aggregate(outstandingAmountPipeline);
        if(!outstandingAmount.length) {
            throw new Error('No transactions Made Yet')
        }

        for (let i = 0; i < outstandingAmount.length; i++) {
            let userName = await userDao.getOne({ "userId": outstandingAmount[i]._id.userId });
            msg += `${userName.name} has to pay you ${outstandingAmount[i].outstandingAmount}\n`
        }
        return Promise.resolve(msg);
    } catch (error) {
        return Promise.reject(error);
    }
}

async function fetchUserDebitTransactions(chatId) {
    try {
        let msg = "";
        let user = await userDao.getOne({ "chatId": chatId });
        if (!user) {
            throw new Error('User Not found');
        }

        var outstandingAmountPipeline = [
            {
                "$match": { "updatedFor": user.userId }
            },
            {
                "$group": {
                    "_id": { "userId": "$updatedBy", "name": "$updaterDetails.first_name" },
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

module.exports.signup = singnup;
module.exports.update = update;
module.exports.fetchUserDebitTransactions = fetchUserDebitTransactions;
module.exports.fetchUserCreditTransactions = fetchUserCreditTransactions;