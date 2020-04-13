
interface CollectionBase<T extends DbObject> {
  collectionName: string
  options: any
  
  addDefaultView: any
  addView: any
  views: any
  getParameters: any
  simpleSchema: any
  addField: any
  helpers: any
  
  // TODO: Type-system plumbing should handle the fact that loaders are available
  // if you get the collection via a resolver's context, but not available if you
  // just import the collection.
  loader: any
  
  rawCollection: any
  checkAccess: any
  find: (selector?: MongoSelector<T>, options?: MongoFindOptions<T>, projection?: MongoProjection<T>) => FindResult<T>
  findOne: (selector?: string|MongoSelector<T>, options?: MongoFindOneOptions<T>, projection?: MongoProjection<T>) => T
  update: (selector?: string|MongoSelector<T>, modifier: MongoModifier<T>, options?: MongoUpdateOptions<T>) => WriteResult
  remove: any
  insert: any
  aggregate: any
}

interface FindResult<T> {
  fetch: ()=>Array<T>
  count: ()=>number
}

type MongoSelector<T extends DbObject> = Record<string,any>; //TODO
type MongoProjection<T extends DbObject> = Record<string,number>; //TODO
type MongoModifier<T extends DbObject> = any; //TODO

type MongoFindOptions<T extends DbObject> = any; //TODO
type MongoFindOneOptions<T extends DbObject> = any; //TODO
type MongoUpdateOptions<T extends DbObject> = any; //TODO
type MongoRemoveOptions<T extends DbObject> = any; //TODO
type MongoInsertOptions<T extends DbObject> = any; //TODO

// Common base type for everything that has an _id field (including both raw DB
// objects and fragment-resolver results).
interface HasIdType {
  _id: string
}

// Common base type for results of database lookups.
interface DbObject extends HasIdType {
  schemaVersion: number
}
