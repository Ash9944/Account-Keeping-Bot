import { Dao } from './base'

export const transactionDao = new Dao("transactions");

export type Transactions = {
    transactionId: String,
    transactedOn: Date,
    updatedBy: Object,
    updatedAmount: Number,
    description: String,
    updatedFor: Object
}
