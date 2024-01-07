import { Dao } from './base'

export const transactionDao = new Dao("transactions");

export type Transactions = {
    totalAmount? : Number | null,
    transactionId: String,
    transactedOn: Date,
    updatedBy: Object,
    updatedAmount: Number,
    description: String,
    updatedFor: Object
}
