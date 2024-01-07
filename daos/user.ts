import { Dao } from './base'
import { ObjectId } from 'mongodb';

export const userDao = new Dao("users");

export type User =  {
    _id? : ObjectId | null,
    userId : String,
    name: String,
    chatId: Number,
    createdOn: Date
}
