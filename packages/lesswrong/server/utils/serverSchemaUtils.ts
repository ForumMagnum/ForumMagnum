import { getAllCollections } from '../../lib/vulcan-lib/getCollection';
import { getSchema } from '../../lib/utils/getSchema';
import some from 'lodash/some';

const fieldsWithServerExtensions: Partial<Record<CollectionNameString,string[]>> = {}

// Given a collection and a fieldName=>fieldSchema dictionary, add properties
// to existing fields on the collection schema, by shallow merging them. If any
// of the fields named don't already exist, throws an error. This is used for
// making parts of the schema (in particular, resolvers, onCreate callbacks,
// etc) specific to server-side code.
export function augmentFieldsDict<T extends DbObject>(collection: CollectionBase<T>, fieldsDict: Record<string,CollectionFieldSpecification<T>>): void {
  // _simpleSchema is a cache that's regenerated on request; set it to null to invalidate
  collection._simpleSchema = null;
  
  if (!fieldsWithServerExtensions[collection.collectionName]) {
    fieldsWithServerExtensions[collection.collectionName] = [];
  }
  
  // Shallow-merge each field
  for (let key in fieldsDict) {
    if (key in collection._schemaFields) {
      fieldsWithServerExtensions[collection.collectionName]!.push(key);
      collection._schemaFields[key] = {...collection._schemaFields[key], ...fieldsDict[key]};
    } else {
      throw new Error("Field does not exist: "+key);
    }
  }
}

export function assertAllServerFieldsExtended() {
  for(let collection of getAllCollections()) {
    const collectionName = collection.collectionName;
    const schema = getSchema(collection);

    for (let fieldName of Object.keys(schema)) {
      if (schema[fieldName].hasServerSide) {
        if(!fieldsWithServerExtensions[collectionName]) {
          throw new Error(`${collectionName}.${fieldName} marked with hasServerSide but no server-side extension for that collection is defined`);
        }
        if(!some(fieldsWithServerExtensions[collectionName], f=>f===fieldName)) {
          throw new Error(`${collectionName}.${fieldName} marked with hasServerSide but server-side extension is missing that field`);
        }
      }
    }
  }
}
