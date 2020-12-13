import { MongoClient } from 'mongodb';

let client: any = null;
let db: any = null;
export const setDatabaseConnection = (_client, _db) => {
  client = _client;
  db = _db;
}
export const getDatabase = () => db;

export class MongoCollection<T extends DbObject> {
  tableName: string
  
  constructor(tableName: string) {
    this.tableName = tableName;
  }
  
  getTable = () => {
    if (webpackIsServer) { 
      return db.collection(this.tableName);
    } else {
      throw new Error("Attempted to run mongodb query on the cleint");
    }
  }
  
  find = (selector?: MongoSelector<T>, options?: MongoFindOptions<T>, projection?: MongoProjection<T>): FindResult<T> => {
    return {
      fetch: async () => {
        const table = this.getTable();
        const result = await table.find(selector, {
          ...options,
        }).toArray()
        return result;
      },
      count: async () => {
        // TODO
        return 0;
      }
    };
  }
  findOne = async (selector?: string|MongoSelector<T>, options?: MongoFindOneOptions<T>, projection?: MongoProjection<T>): Promise<T|null> => {
    const table = this.getTable();
    return await table.findOne(selector, {
      ...options,
    });
  }
  insert = ()=>{}
  _ensureIndex = ()=>{}
  
  
  //TODO
  views: any
  defaultView: any
  addView: any
  aggregate: any
  rawCollection: any
  addDefaultView: any
}

