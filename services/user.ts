import { userDao, User } from "../daos/user";
import { transactionDao, Transactions } from "../daos/transactions";
import { getNextSequence } from '../daos/mongoDbUtil'
import * as moment from "moment";


export async function signup(details: any): Promise<Object> {
    try {
        if (!details?.chat.id) {
            throw new Error('User Details Missing');
        }

        var isExist = await userDao.count({ 'chatId': details.chat.id })
        if (isExist) {
            throw new Error('You are already a member of this bot');
        }

        var userId = await getNextSequence('users', 'userId');
        let user: User = {
            "userId": userId.toString(),
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

export async function update(updaterDetails: any, bot: any): Promise<void> {
    try {

        let updaterUser: any = await userDao.getOne({ "chatId": updaterDetails.chat.id });
        if (!updaterUser) {
            throw new Error('You Are Not Signed up');
        }

        let users = await transactionDao.distinct('updatedFor.name', { "updatedBy.chatId": updaterDetails.chat.id });

        let buttons: Array<any> = users.map(item => { return { text: item, callback_data: item } });
        buttons = splitArray(buttons, 3)
        buttons.push([{ text: "List users", callback_data: "LIST" }])
        const keyboard = {
            inline_keyboard: buttons,
        };
        // Send a message with the inline keyboard
        var msgDetails = await bot.sendMessage(updaterDetails.chat.id, 'Choose a user to update amount:', { reply_markup: keyboard });

        let result: any = await listencallbackQueries(bot, msgDetails);

        if (result.data === "LIST") {
            bot.deleteMessage(updaterDetails.chat.id, result.message.message_id);

            let changedUsers = await userDao.distinct("name", { "name": { "$nin": users }, "chatId": { "$ne": updaterDetails.chat.id } });
            if (!changedUsers.length) {
                throw new Error('There are no users to update ! Share it with your friends @tg1998bot');
            }

            let changedButtons: Array<any> = changedUsers.map(item => { return { text: item, callback_data: item } });
            changedButtons = splitArray(changedButtons, 3)
            const keyboard = {
                inline_keyboard: changedButtons

            };
            // Send a message with the inline keyboard
            msgDetails = await bot.sendMessage(updaterDetails.chat.id, 'Choose a user to update amount:', { reply_markup: keyboard });

            var secondResult: any = await listencallbackQueries(bot, msgDetails);
            if (!secondResult) {
                return;
            }
        }
        if (!result) {
            return;
        }

        let query = (secondResult?.data || result.data)
        let userToupdate: any = await userDao.getOne({ "name": query })
        if (!userToupdate) {
            return;
        }
        var msg = await bot.sendMessage(updaterDetails.chat.id, `To update ${userToupdate.name} type : amount,reason,date of transaction(DD/MM/YY) : optional\nEg : 2000,Restaurant split,3/12/23 : optional`);
        let amountResp: any = await listenMessages(bot, msg);

        var arr = amountResp.text.split(',')
        if (!arr.length) {
            throw new Error('No parameters given for update')
        }

        var amount = parseInt(arr[0]);
        if (isNaN(amount) || !arr[0]) {
            throw new Error("Not a Proper Format For Update Amount")
        }

        var reason = arr[1];
        if (!reason && moment(reason, 'DD/MM/YY', true).isValid()) {
            throw new Error("No reason Found");
        }

        if (arr[2]) {
            var isCorrectDate = moment(arr[2], 'DD/MM/YY', true).isValid();
            if (!isCorrectDate) {
                throw new Error("Please Enter a valid Date of Tansaction")
            }
            var dateStr: string = moment(arr[2], 'DD/MM/YY').format("YYYY-MM-DD");
            var date: any = new Date(dateStr)
        }

        var transactionId = await getNextSequence('transactions','transactionId');
        var transactionDetail: Transactions = {
            "transactionId": transactionId.toString(),
            "transactedOn": date || new Date(),
            "updatedBy": updaterUser,
            "updatedAmount": amount,
            "description": reason,
            'updatedFor': userToupdate
        }
        await transactionDao.create(transactionDetail);

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
        var outstandingAmount : any = await transactionDao.aggregate(outstandingAmountPipeline);
        if (!outstandingAmount.length) {
            throw new Error('No transactions Made Yet')
        }
        var updateTotalAmount: any = await transactionDao.updateOne({ "transactionId": transactionId.toString() },'SET' ,{
            "totalAmount": outstandingAmount[0].outstandingAmount
        })
        if (!updateTotalAmount){
            throw new Error("Failed to update transaction")
        }

        bot.sendMessage(userToupdate.chatId, `Your outstanding amount to ${updaterDetails.from.first_name} Is ${outstandingAmount[0].outstandingAmount} \n You Have been Updated ${amount} for ${reason} on ${moment(transactionDetail.transactedOn).format("DD/MMM/YY hh:mm A")}`);

        bot.sendMessage(updaterDetails.chat.id, "Updated user");

    } catch (error) {
        return Promise.reject(error);
    }
}

export async function fetchUserDebit(chatId : number) : Promise<string> {
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
        var outstandingAmount : Array<any> = await transactionDao.aggregate(outstandingAmountPipeline);
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

export async function fetchUserCredit(chatId: number) {
    try {
        let msg = "";
        let user : any = await userDao.getOne({ "chatId": chatId });
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
        var outstandingAmount : Array<any> = await transactionDao.aggregate(outstandingAmountPipeline);
        if (!outstandingAmount.length) {
            throw new Error('Update a user using command /update');
        }

        for (let i = 0; i < outstandingAmount.length; i++) {
            let userName : any = await userDao.getOne({ "chatId": outstandingAmount[i]._id.userId });
            msg += `${userName.name} has to pay you ${outstandingAmount[i].outstandingAmount}\n`
        }

        return Promise.resolve(msg);
    } catch (error) {
        return Promise.reject(error);
    }
}


function splitArray(arr: Array<any>, numberOfElements: number): Array<Array<any>> {

    let mainArr: Array<any> = [];
    let subArray: Array<any> = [];

    arr.forEach((item, ind) => {
        subArray.push(item);

        if ((ind + 1) % numberOfElements === 0) {
            mainArr.push(subArray);
            subArray = [];
            return;
        }

        if ((ind + 1) === arr.length) {
            mainArr.push(subArray);
            subArray = [];
            return;
        }
    })

    return mainArr
}

function listencallbackQueries(bot: any, chat: any): Promise<Object> {
    return new Promise((resolve, reject) => {
        bot.on('callback_query', async (msg: any) => {
            if (msg.message.message_id === chat.message_id) {
                return resolve(msg);
            }
        })
    })
}

function listenMessages(bot: any, chat: any): Promise<Object> {
    return new Promise((resolve, reject) => {
        bot.on('message', (msg: any) => {
            return resolve(msg);
        })
    })
}