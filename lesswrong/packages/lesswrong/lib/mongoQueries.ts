import { getCollection } from './vulcan-lib/collections';

// Simple function wrappers around mongodb operations. These are slightly silly
// and exist primarily for the purpose of breaking import cycles; because they
// use collection *names* rather than collection *operators*, they can be used
// without issue from inside collection schemas and the functions those schemas
// import. If you don't need to break an import cycle, prefer using the methods
// on the collections themselves.
//
// Only usable server side. These are in `lib` because some other server-side-
// only code is in `lib` when technically it shouldn't be, mainly resolvers
// that are embedded in schemas that are shared between client and server.

export async function mongoFindOne<N extends CollectionNameString>(collectionName: N, selector: string|MongoSelector<ObjectsByCollectionName[N]>, options?: MongoFindOneOptions<ObjectsByCollectionName[N]>, projection?: MongoProjection<ObjectsByCollectionName[N]>): Promise<ObjectsByCollectionName[N]|null>
{
  const collection = getCollection(collectionName);
  return await collection.findOne(selector, options, projection) as ObjectsByCollectionName[N]|null;
}

export async function mongoFind<N extends CollectionNameString>(collectionName: N, selector?: MongoSelector<ObjectsByCollectionName[N]>, options?: MongoFindOptions<ObjectsByCollectionName[N]>, projection?: MongoProjection<ObjectsByCollectionName[N]>)
{
  const collection: CollectionBase<N> = getCollection(collectionName);
  return await collection.find(selector, options, projection).fetch();
}

export async function mongoCount<N extends CollectionNameString>(collectionName: N, selector?: MongoSelector<ObjectsByCollectionName[N]>, options?: MongoFindOptions<ObjectsByCollectionName[N]>, projection?: MongoProjection<ObjectsByCollectionName[N]>): Promise<number>
{
  const collection = getCollection(collectionName);
  return await collection.find(selector, options, projection).count();
}

export async function mongoAggregate<N extends CollectionNameString>(collectionName: N, pipeline: any): Promise<any>
{
  const collection = getCollection(collectionName);
  return await collection.aggregate(pipeline).toArray();
}

export async function mongoUpdateOne<N extends CollectionNameString>(collectionName: N, selector?: string|MongoSelector<ObjectsByCollectionName[N]>, modifier?: MongoModifier<ObjectsByCollectionName[N]>, options?: MongoUpdateOptions<ObjectsByCollectionName[N]>): Promise<number>
{
  const collection = getCollection(collectionName);
  return await collection.rawUpdateOne(selector, modifier, options);
}
export async function mongoUpdateMany<N extends CollectionNameString>(collectionName: N, selector?: string|MongoSelector<ObjectsByCollectionName[N]>, modifier?: MongoModifier<ObjectsByCollectionName[N]>, options?: MongoUpdateOptions<ObjectsByCollectionName[N]>): Promise<number>
{
  const collection = getCollection(collectionName);
  return await collection.rawUpdateMany(selector, modifier, options);
}
export async function mongoRemove<N extends CollectionNameString>(collectionName: N, selector?: string|MongoSelector<ObjectsByCollectionName[N]>, options?: MongoRemoveOptions<ObjectsByCollectionName[N]>)
{
  const collection = getCollection(collectionName);
  return await collection.rawRemove(selector, options);
}

export async function mongoInsert<N extends CollectionNameString>(collectionName: N, insertedObject: ObjectsByCollectionName[N], options: MongoInsertOptions<ObjectsByCollectionName[N]>)
{
  const collection = getCollection(collectionName);
  return await collection.rawInsert(insertedObject, options);
}
