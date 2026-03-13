const { MongoClient } = require("mongodb");

const mongoUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017";
const databaseName = process.env.MONGODB_DB_NAME || "fca_refugee_support_program";
const collectionName = "beneficiaries";

let client;
let database;

async function ensureDatabase() {
  // Reuse the existing connection once the first successful connection is made.
  if (database) {
    return database;
  }

  client = new MongoClient(mongoUrl);
  await client.connect();
  database = client.db(databaseName);
  return database;
}

async function getCollection() {
  const activeDatabase = await ensureDatabase();
  return activeDatabase.collection(collectionName);
}

async function getBeneficiaries() {
  const collection = await getCollection();
  return collection.find({}, { projection: { _id: 0 } }).toArray();
}

async function saveBeneficiary(beneficiary) {
  // Save the custom record shape while excluding Mongo's internal id from API responses.
  const collection = await getCollection();
  await collection.insertOne(beneficiary);
  return beneficiary;
}

async function closeDatabase() {
  if (!client) {
    return;
  }

  await client.close();
  client = undefined;
  database = undefined;
}

module.exports = {
  ensureDatabase,
  getBeneficiaries,
  saveBeneficiary,
  closeDatabase
};
