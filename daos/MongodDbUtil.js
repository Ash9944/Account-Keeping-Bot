const mongodb = require('mongodb');
module.exports = mongodb;
const config = require('../config.json');
const url = config.dbUrl;


const mongoClient = new mongodb.MongoClient(url);

let _client;
//Cache the mongodb connection
const dbCache = {};

async function connect() {
    try {
        _client = await mongoClient.connect();
        dbCache.db = _client.db();
        console.log(`Connection with mongodb successful And The Bot is On - ${new Date().toString()}`);
        return dbCache.db;
    } catch (error) {
        console.log(`Error while connecting to Mongo DB - ${new Date().toString()} - ${error}`);
        return Promise.reject(error);
    }
}

connect();

module.exports.getDb = function () {
    return dbCache.db;
}

module.exports.getMongodb = function () {
    return mongodb;
}

module.exports.connect = connect;
module.exports.ObjectId = mongodb.ObjectId;