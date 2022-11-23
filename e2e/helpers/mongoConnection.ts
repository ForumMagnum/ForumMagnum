import { MongoClient } from "mongodb";
import type { MongoClient as MongoClientType } from "mongodb";
import { MongoMemoryServer } from 'mongodb-memory-server';

let instance: MongoMemoryServer;
let dbConnection: MongoClientType;

export const getMongoConnection = async (): Promise<MongoClientType> => {
  if (!dbConnection) {
    if (!instance) {
      instance = await MongoMemoryServer.create();
    }
    dbConnection = new MongoClient(instance.getUri(), {useUnifiedTopology: true});
    await dbConnection.connect();
  }
  return dbConnection;
}
