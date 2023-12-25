const mongodb = require('./MongodDbUtil');

const updateOps = {
    "SET": "$set",
    "UNSET": "$unset",
    "PULL": "$pull",
    "PUSH": "$push",
    "ADDTOSET": "$addToSet"
}

/**
 * 
 * @param {Object} record - valid JSON object
 * @returns {Promise<Object>} - JSON Object with id created 
 */
function create(record) {
    let db = mongodb.getDb();
    let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.insertOne(record)
            .then(result => { resolve(result) })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {Array<Object>} records - valid array of JSON Objects
 * @returns {Promise<Object>}  - JSON Object with ids created 
 */
function createMany(records) {
    let db = mongodb.getDb();
    let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.insertMany(records)
            .then(result => { resolve(result) })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {Object} query - condition to filter value form the collection of object 
 * @returns {Promise<Number>}  Number of records matches
 */
function count(query) {
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.count(query)
            .then(result => { resolve(result) })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {Object} projection - valid key values paires to project / show particalar values form the collection of object
 * @returns {Promise<Array<Object>>} - records in the collection
 */
function getAll(projection = {}) {
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.find({}, projection).toArray()
            .then(result => { resolve(result) })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {String|ObjectId} id - hash code string / bson - ObjectId
 * @param {Object} projection - valid key values paires to project / show particalar values form the collection of object
 * @returns {Object} - record that matches the condition
 */
function get(id, projection = {}) {
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.findOne({ _id: new mongodb.ObjectId(id) }, projection)
            .then(result => { resolve(result) })
            .catch(error => { reject(error) });
    });
};

/**
 * 
 * @param {Object} query - condition to filter value form the collection of object 
 * @param {Object} projection - valid key values paires to project / show particalar values form the collection of object
 * @returns {Promise<Object>} - first record that matches the condition
 */
function getOne(query, projection = {}) {
    let db = mongodb.getDb();
    let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.findOne(query, projection)
            .then(result => { resolve(result) })
            .catch(error => { reject(error) });
    });
};

/**
 * 
 * @param {Object} query - condition to filter value form the collection of object 
 * @param {Object} projection - valid key values paires to project / show particalar values form the collection of object
 * @returns {Promise<Array<Object>>} - records that matches the condition 
 */
function getBy(query, projection = {},limitValue = 0) {
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.find(query).project(projection).limit(limitValue).toArray()
            .then(result => { resolve(result) })
            .catch(error => { reject(error) });
    });
};


/**
 * 
 * @param {Object} preQuery - Base collection match query 
 * @param {Object} option - Skip, Limit number of records.
 * @param {Object} sort - Sort fields.
 * @param {Array<Object>} blPipeline - Bussines logic like lookup, project, group, .., etc.
 * @param {Object} postQuery - Query needs to apply after bussines logic.
 * @returns {Promise<Array<Object>>} - records that matches the condition 
 * @note If this pagination needs to be override write a function overRidePagination with proper params in specific dao file.
 */
function basicPagination(preQuery, option, sort, blPipeline = [], postQuery = {}) {
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    let pipeline = [];

    // append base query
    pipeline.push({ "$match": preQuery });
    let facet = { "records": [], "count": [] };
    // append lookup in records filter pipeline
    facet.records = facet.records.concat(blPipeline);
    // if post lookup qurey exists append the query in record filter pipeline & in count pipeline
    if (Object.keys(postQuery).length) {
        facet.records.push({ "$match": postQuery });
        facet.count = facet.count.concat(blPipeline);
        facet.count.push({ "$match": postQuery });
    }
    // limit option for the record filter
    facet.records.push({ "$sort": sort });
    facet.records.push({ "$skip": (option.skip || 0) });
    facet.records.push({ "$limit": (option.limit || 15) });
    // get count number of records 
    facet.count.push({ "$count": "totalRecords" });
    // append facet in pipeline
    pipeline.push({ "$facet": facet });

    return new Promise((resolve, reject) => {
        collection.aggregate(pipeline).toArray()
            .then(results => {
                let [result] = results
                let { records, count } = result;
                if (!count.length) {
                    count.push({ totalRecords: 0 });
                }
                let response = {
                    records: records,
                    recordLength: records.length,
                    totalRecords: count[0].totalRecords
                }
                resolve(response);
            })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {String} field - Field name for which unique values has to be retrived
 * @param {Object} query - condition to filter value form the collection of object 
 * @returns {Promise<Array<String|Number..>>}  Unique value in flat array form
 */
function distinct(field, query = {}) {
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.distinct(field, query)
            .then(result => { resolve(result) })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {Object} query - condition to filter value form the collection of object 
 * @param {String} operation - name that represent the atomic operations SET/PULL/PUSH/..
 * @param {Object} detail - valid JSON Object without value _id
 * @returns {Promise<Object>} - Object with nMatched, nModified count.
 */
function updateMany(query, operation, detail) {
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        if (!updateOps[operation]) {
            reject(new Error("invalid atomic operator on update"));
            return;
        }
        let detailToUpdate = {};
        detailToUpdate[updateOps[operation]] = detail;
        collection.updateMany(query, detailToUpdate)
            .then(result => { resolve(result) })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {Object} query - condition to filter value form the collection of object 
 * @param {String} operation - name that represent the atomic operations SET/PULL/PUSH/..
 * @param {Object} detail - valid JSON Object without value _id
 * @returns {Promise<Object>} - Object with nMatched, nModified count.
 */
function updateOne(query, operation, detail) {
    if (detail._id) {
        delete detail._id
    }
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        if (!updateOps[operation]) {
            reject(new Error("invalid atomic operator on update"));
            return;
        }
        let detailToUpdate = {};
        detailToUpdate[updateOps[operation]] = detail;
        collection.updateOne(query, detailToUpdate)
            .then(result => { resolve(result) })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {String} id - hash code string / bson - ObjectId
 * @param {String} operation - name that represent the atomic operations SET/PULL/PUSH/..
 * @param {Object} detail - valid JSON Object without value _id
 * @returns {Promise<Object>} - Object with nMatched, nModified count.
 */
function update(id, operation, detail) {
    let db = mongodb.getDb();
    let collection = db.collection(this.getCollectionName());
    if (detail._id) {  
        delete detail._id
    }
    return new Promise((resolve, reject) => {
        if (!updateOps[operation]) {
            reject(new Error("invalid atomic operator on update"));
            return;
        }
        let detailToUpdate = {};
        detailToUpdate[updateOps[operation]] = detail;
        collection.updateOne({ _id: new mongodb.ObjectId(id) }, detailToUpdate)
            .then(result => { resolve(result) })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {Array<Object>} pipeline - Array of object with logics $match, $project, $group, $lookup ..
 * @returns {Promise<Array<Object>>} - records that matches the condition 
 */
function aggregate(pipeline) {
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.aggregate(pipeline, { allowDiskUse: true }).toArray()
            .then(results => { resolve(results); })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {String} id - hash code string / bson - ObjectId
 * @returns {Promise<Object>} - Object with nRemoved count.
 */
function remove(id) {
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.deleteOne({ _id: new mongodb.ObjectId(id) })
            .then(results => { resolve(results); })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {*} query - condition to filter value form the collection of object 
 * @returns {Promise<Object>} - Object with nRemoved count.
 */
function removeBy(query) {
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.deleteMany(query)
            .then(results => { resolve(results); })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {*} query - condition to filter value form the collection of object 
 * @returns {Promise<Object>} - Object with nRemoved count.
 */
function removeMany(query) {
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.deleteMany(query)
            .then(results => { resolve(results); })
            .catch(error => { reject(error) });
    });
}

/**
 * 
 * @param {Array<Object>} bulk - Array of object with set of write operation like insert/udpate/remove 
 * @returns {Promise<Object>} - Object with upserted/removed count.
 */
function bulkWrite(bulk) {
    let db = mongodb.getDb();
     let collection = db.collection(this.getCollectionName());
    return new Promise((resolve, reject) => {
        collection.bulkWrite(bulk)
            .then(results => { resolve(results); })
            .catch(error => { reject(error) });
    });
};

function getDb() {
    return mongodb.getDb();
}

module.exports = function BaseDao(collectionName) {
    return {
        aggregate: aggregate,
        basicPagination: basicPagination,
        bulkWrite: bulkWrite,
        count: count,
        create: create,
        createMany: createMany,
        distinct, distinct,
        getAll: getAll,
        get: get,
        getBy: getBy,
        getCollectionName: function () {
            return collectionName;
        },
        getDb: getDb,
        getOne: getOne,
        remove: remove,
        removeBy: removeBy,
        removeMany: removeMany,
        update: update,
        updateMany: updateMany,
        updateOne: updateOne,
    };
};