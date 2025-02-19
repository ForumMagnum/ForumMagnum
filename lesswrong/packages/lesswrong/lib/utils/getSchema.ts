import SimpleSchema from 'simpl-schema';

// Get a dictionary from field names to the properties specified in our
// collection schema files. Note that this is *not* a SimpleSchema class; if
// you want one of those (for validation), use Collection.simpleSchema()
// instead.
export function getSchema<N extends CollectionNameString>(
  collection: CollectionBase<N>,
): SchemaType<N> {
  //return collection._schemaFields;
  return getSimpleSchema(collection)._schema;
}

export function getSimpleSchema<N extends CollectionNameString>(
  collection: CollectionBase<N>,
): SimpleSchemaType<N> {
  if (!collection._simpleSchema)
    collection._simpleSchema = new SimpleSchema(collection._schemaFields as AnyBecauseHard);
  return collection._simpleSchema;
}
