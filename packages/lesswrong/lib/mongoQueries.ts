import { getCollection } from './vulcan-lib/collections';

export function mongoFindOne<N extends CollectionNameString>(collectionName: N, selector: string|MongoSelector<ObjectsByCollectionName[N]>, options?: MongoFindOneOptions<ObjectsByCollectionName[N]>, projection?: MongoProjection<ObjectsByCollectionName[N]>): ObjectsByCollectionName[N]|null
{
  const collection = getCollection(collectionName);
  return collection.findOne(selector, options, projection) as ObjectsByCollectionName[N]|null;
}

export function mongoFind<N extends CollectionNameString>(collectionName: N, selector?: MongoSelector<ObjectsByCollectionName[N]>, options?: MongoFindOptions<ObjectsByCollectionName[N]>, projection?: MongoProjection<ObjectsByCollectionName[N]>): Array<ObjectsByCollectionName[N]>
{
  const collection = getCollection(collectionName);
  return collection.find(selector, options, projection).fetch() as ObjectsByCollectionName[N][];
}

export function mongoCount<N extends CollectionNameString>(collectionName: N, selector?: MongoSelector<ObjectsByCollectionName[N]>, options?: MongoFindOptions<ObjectsByCollectionName[N]>, projection?: MongoProjection<ObjectsByCollectionName[N]>): number
{
  const collection = getCollection(collectionName);
  return collection.find(selector, options, projection).count();
}

export function mongoAggregate<N extends CollectionNameString>(collectionName: N, pipeline: any): any
{
  const collection = getCollection(collectionName);
  return collection.aggregate(pipeline);
}

export function mongoUpdate<N extends CollectionNameString>(collectionName: N, selector?: string|MongoSelector<ObjectsByCollectionName[N]>, modifier?: MongoModifier<ObjectsByCollectionName[N]>, options?: MongoUpdateOptions<ObjectsByCollectionName[N]>): number
{
  const collection = getCollection(collectionName);
  return collection.update(selector, modifier, options);
}
export function mongoRemove<N extends CollectionNameString>(collectionName: N, selector?: string|MongoSelector<ObjectsByCollectionName[N]>, options?: MongoRemoveOptions<ObjectsByCollectionName[N]>)
{
  const collection = getCollection(collectionName);
  return collection.remove(selector, options);
}

export function mongoInsert<N extends CollectionNameString>(collectionName: N, insertedObject: ObjectsByCollectionName[N], options: MongoInsertOptions<ObjectsByCollectionName[N]>)
{
  const collection = getCollection(collectionName);
  return collection.insert(insertedObject, options);
}
