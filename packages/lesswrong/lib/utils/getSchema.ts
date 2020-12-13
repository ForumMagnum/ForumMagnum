
// Get a dictionary from field names to the properties specified in our
// collection schema files. Note that this is *not* a SimpleSchema class; if
// you want one of those (for validation), use Collection.simpleSchema()
// instead.
export function getSchema<T extends DbObject>(collection: CollectionBase<T>): SchemaType<T> {
  if (!collection.simpleSchema)
    throw new Error("Missing schema on collection "+collection.collectionName);
  return collection.simpleSchema()._schema;
}
