import { getCollection } from './vulcan-lib/getCollection';

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
