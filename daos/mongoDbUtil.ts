import { MongoClient, Db, ObjectId, Collection } from 'mongodb'
import { dbUrl } from '../config.json'
const mongoClient = new MongoClient(dbUrl);
export const ObjectID = ObjectId
interface dbCache {
    db: any;
}
//Cache the mongodb connection
const dbCache: dbCache = { "db": {} };

export async function connect(): Promise<Db> {
    try {
        let _client: any = await mongoClient.connect();
        dbCache.db = _client.db();
        console.log(`Connection with mongodb successful And The Bot is On - ${new Date().toString()}`);
        return dbCache.db;
    } catch (error) {
        console.log(`Error while connecting to Mongo DB - ${new Date().toString()} - ${error}`);
        return Promise.reject(error);
    }
}

export function getDb():Db{
    return dbCache.db;
}

export async function getNextSequence(collectionName: string, fieldName: string): Promise<number> {
    try {
        const db = getDb();
        const sequenceCollection: Collection<any> = db.collection('counter');

        const result: any = await sequenceCollection.findOneAndUpdate(
            { _id: collectionName, fieldName: fieldName },
            { $inc: { sequence_value: 1 } },
            {
                upsert: true,
                returnDocument: 'after',
                projection: { sequence_value: 1 },
            }
        );

        return Promise.resolve(result.sequence_value);
    } catch (error) {
        return Promise.reject(error);
    }
}
