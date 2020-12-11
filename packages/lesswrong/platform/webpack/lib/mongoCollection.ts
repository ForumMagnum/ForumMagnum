
export class MongoCollection<T extends DbObject> {
  constructor(tableName: string) {
  }
  
  find = (selector?: MongoSelector<T>, options?: MongoFindOptions<T>, projection?: MongoProjection<T>): FindResult<T> => {
    return null;
  }
  findOne = (selector?: string|MongoSelector<T>, options?: MongoFindOneOptions<T>, projection?: MongoProjection<T>): T | null => {
    // TODO
    return [];
  }
  _ensureIndex = ()=>{}
  
  
  //TODO
  views: any
  defaultView: any
  addView: any
  aggregate: any
  rawCollection: any
  addDefaultView: any
}
