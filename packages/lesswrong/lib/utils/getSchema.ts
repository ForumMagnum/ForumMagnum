import SimpleSchema from 'simpl-schema';

// Get a dictionary from field names to the properties specified in our
// collection schema files. Note that this is *not* a SimpleSchema class; if
// you want one of those (for validation), use Collection.simpleSchema()
// instead.
export function getSchema<T extends DbObject>(collection: CollectionBase<T>): SchemaType<T> {
  //return collection._schemaFields;
  return getSimpleSchema(collection)._schema;
}

export function getSimpleSchema<T extends DbObject>(collection: CollectionBase<T>): SimpleSchemaType<T> {
  if (!collection._simpleSchema)
    collection._simpleSchema = new SimpleSchema(collection._schemaFields as any);
  return collection._simpleSchema;
}
