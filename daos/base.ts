import { ObjectId } from 'mongodb';
import * as mongodb from './mongoDbUtil';
type id = string | ObjectId

const updateOps : Object = {
    "SET" : "$set",
    "UNSET": "$unset",
    "PULL": "$pull",
    "PUSH": "$push",
    "ADDTOSET": "$addToSet"
}

export class Dao{
    collectionName: string;

    constructor(collectionName: string){
        this.collectionName = collectionName;
    }

    async distinct(field: string, query: Object = {}) {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.distinct(field, query);
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error)
        }
    }

    async aggregate(pipeline: Array<Object>): Promise<Array<Object>> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.aggregate(pipeline, { allowDiskUse: true }).toArray()
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async bulkWrite(bulk: Array<any>): Promise<Object> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.bulkWrite(bulk);
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    };

    async count(query: Object): Promise<Number> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.countDocuments(query);
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async create(record: Object): Promise<Object> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.insertOne(record);
            return Promise.resolve(result);
        }
        catch (error) {
            return Promise.reject(error);
        }
    }

    async createMany(records: Array<Object>): Promise<Object> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.insertMany(records);
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async getAll(projection: Object = {}): Promise<Array<Object>> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.find({}, projection).toArray()
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async get(id: id, projection: Object = {}): Promise<Object | null> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.findOne({ _id: new ObjectId(id) }, projection);
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    };

    async getBy(query: Object, projection: Object = {}, limitValue: number = 0): Promise<Array<Object>> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.find(query, projection).project(projection).limit(limitValue).toArray();
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }

    };

    async getOne(query: Object, projection: Object = {}): Promise<Object | null> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.findOne(query, projection);
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    };


    async remove(id: id): Promise<Object> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.deleteOne({ _id: new ObjectId(id) })
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async removeBy(query: Object): Promise<Object> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.deleteMany(query);
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async removeMany(query: Object): Promise<Object> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            let result = await collection.deleteMany(query);
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async update(id: id, operation: string, detail: Object): Promise<Object> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            if (!(updateOps as any)[operation]) {
                return Promise.reject(new Error("invalid atomic operator on update"));
            }
            let detailToUpdate = {};
            (detailToUpdate as any)[(updateOps as any)[operation]] = detail;
            let result = await collection.updateOne({ _id: new ObjectId(id) }, detailToUpdate)
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error)
        }
    }

    async updateMany(query: Object, operation: string, detail: Object): Promise<Object | void> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            if (!(updateOps as any)[operation]) {
                return Promise.reject(new Error("invalid atomic operator on update"));
            }
            let detailToUpdate = {};
            (detailToUpdate as any)[(updateOps as any)[operation]] = detail;
            let result = await collection.updateMany(query, detailToUpdate);
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error)
        }
    }

    async updateOne(query: Object, operation: string, detail: Object): Promise<Object> {
        try {
            let db = mongodb.getDb();
            let collection = db.collection(this.collectionName);
            if (!(updateOps as any)[operation]) {
                return Promise.reject(new Error("invalid atomic operator on update"));
            }
            let detailToUpdate = {};
            (detailToUpdate as any)[(updateOps as any)[operation]] = detail;
            let result = await collection.updateOne(query, detailToUpdate);
            return Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    }
}