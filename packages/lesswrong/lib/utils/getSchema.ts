
export function getSchema<T extends DbObject>(collection: CollectionBase<T>): SchemaType<T> {
  if (!collection.simpleSchema)
    throw new Error("Missing schema on collection "+collection.collectionName);
  return collection.simpleSchema()._schema;
}
