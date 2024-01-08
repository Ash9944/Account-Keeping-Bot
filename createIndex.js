db.users.createIndexes(
    [
        {
            "userId": 1
        },
        {
            "chatId": 1
        }
    ],
    {
        unique: true
    }
)

db.transactions.createIndexes(
    [
        {
            "transactionId": 1
        },
        {
            "updatesFor.chatId": 1
        },
        {
            "updatesBy.chatId": 1
        }
    ],
    {
        unique: false
    }
)