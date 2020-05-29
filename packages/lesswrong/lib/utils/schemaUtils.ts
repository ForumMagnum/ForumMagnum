import { addCallback, getCollection } from '../vulcan-lib';
import Users from '../collections/users/collection';
import SimpleSchema from 'simpl-schema'
import { getWithLoader } from "../loaders";
import { Meteor } from 'meteor/meteor';
import { asyncFilter } from './asyncUtils';
import * as _ from 'underscore';

const generateIdResolverSingle = ({collectionName, fieldName}) => {
  return async (doc, args, context: ResolverContext) => {
    if (!doc[fieldName]) return null

    const { currentUser } = context
    const collection = context[collectionName]

    const resolvedDoc = await collection.loader.load(doc[fieldName])
    if (!resolvedDoc) {
      // eslint-disable-next-line no-console
      console.error(`Broken foreign key reference: ${collectionName}.${fieldName}=${doc[fieldName]}`);
      return null;
    }

    return await accessFilterSingle(currentUser, collection, resolvedDoc, context);
  }
}

const generateIdResolverMulti = ({collectionName, fieldName, getKey = (a=>a)}) => {
  return async (doc, args, context: ResolverContext) => {
    if (!doc[fieldName]) return []
    const keys = doc[fieldName].map(getKey)

    const { currentUser } = context
    const collection = context[collectionName]

    const resolvedDocs = await collection.loader.loadMany(keys)

    return await accessFilterMultiple(currentUser, collection, resolvedDocs, context);
  }
}

// Apply both document-level and field-level permission checks to a single document.
// If the user can't access the document, returns null. If the user can access the
// document, return a copy of the document in which any fields the user can't access
// have been removed. If document is null, returns null.
export const accessFilterSingle = async <T extends DbObject>(currentUser: DbUser|null, collection: CollectionBase<T>, document: T|null, context: ResolverContext|null): Promise<T|null> => {
  const { checkAccess } = collection
  if (!document) return null;
  if (checkAccess && !(await checkAccess(currentUser, document, context))) return null
  const restrictedDoc = Users.restrictViewableFields(currentUser, collection, document)
  return restrictedDoc;
}

// Apply both document-level and field-level permission checks to a list of documents.
// Returns a list where documents which the user can't access are removed from the
// list, and fields which the user can't access are removed from the documents inside
// the list. If currentUser is null, applies permission checks for the logged-out
// view.
export const accessFilterMultiple = async <T extends DbObject>(currentUser: DbUser|null, collection: CollectionBase<T>, unfilteredDocs: Array<T|null>, context: ResolverContext|null): Promise<Array<T>> => {
  const { checkAccess } = collection
  
  // Filter out nulls (docs that were referenced but didn't exist)
  // Explicit cast because the type-system doesn't detect that this is removing
  // nulls.
  const existingDocs: Array<T> = _.filter(unfilteredDocs, d=>!!d) as Array<T>;
  // Apply the collection's checkAccess function, if it has one, to filter out documents
  const filteredDocs = checkAccess ? await asyncFilter(existingDocs, async (d: T) => await checkAccess(currentUser, d, context)) : existingDocs
  // Apply field-level permissions
  const restrictedDocs = Users.restrictViewableFields(currentUser, collection, filteredDocs)
  
  return restrictedDocs;
}

export const foreignKeyField = ({idFieldName, resolverName, collectionName, type}) => {
  if (!idFieldName || !resolverName || !collectionName || !type)
    throw new Error("Missing argument to foreignKeyField");
  
  return {
    type: String,
    foreignKey: collectionName,
    resolveAs: {
      fieldName: resolverName,
      type: type,
      resolver: generateIdResolverSingle({
        collectionName,
        fieldName: idFieldName
      }),
      addOriginalField: true,
    },
  }
}

export function arrayOfForeignKeysField({idFieldName, resolverName, collectionName, type, getKey}: {
  idFieldName: string,
  resolverName: string,
  collectionName: CollectionNameString,
  type: string,
  getKey?: (string)=>string,
}) {
  if (!idFieldName || !resolverName || !collectionName || !type)
    throw new Error("Missing argument to foreignKeyField");
  
  return {
    type: Array,
    resolveAs: {
      fieldName: resolverName,
      type: `[${type}]`,
      resolver: generateIdResolverMulti({
        collectionName,
        fieldName: idFieldName,
        getKey
      }),
      addOriginalField: true
    },
  }
}

export const simplSchemaToGraphQLtype = (type): string|null => {
  if (type === String) return "String";
  else if (type === Number) return "Int";
  else if (type === Date) return "Date";
  else if (type === Boolean) return "Boolean";
  else return null;
}

export const resolverOnlyField = ({type, graphQLtype=null, resolver, graphqlArguments=null, ...rest}: any) => {
  const resolverType = graphQLtype || simplSchemaToGraphQLtype(type);
  if (!type)
    throw new Error("Could not determine resolver graphQL type");
  return {
    type: type,
    optional: true,
    resolveAs: {
      type: resolverType,
      arguments: graphqlArguments,
      resolver: resolver,
    },
    ...rest
  }
}

// Given a collection and a fieldName=>fieldSchema dictionary, add fields to
// the collection schema. We use this instead of collection.addField([...])
// because that one forces an awkward syntax in order to be array-based instead
// of object-based.
export const addFieldsDict = (collection, fieldsDict) => {
  let translatedFields: Array<any> = [];
  for (let key in fieldsDict) {
    translatedFields.push({
      fieldName: key,
      fieldSchema: fieldsDict[key]
    });
  }
  collection.addField(translatedFields);
}

// For denormalized fields, needsUpdate is an optional attribute that
// determines whether the denormalization function should be rerun given
// the new document after an update or an insert
SimpleSchema.extendOptions(['needsUpdate'])

// For denormalized fields, getValue returns the new denormalized value of
// the field, given the new document after an update or an insert
SimpleSchema.extendOptions(['getValue'])

// For denormalized fields, marks a field so that we can automatically
// get the automatically recompute the new denormalized value via
// `Vulcan.recomputeDenormalizedValues` in the Meteor shell
SimpleSchema.extendOptions(['canAutoDenormalize'])


// Helper function to add all the correct callbacks and metadata for a field
// which is denormalized, where its denormalized value is a function only of
// the other fields on the document. (Doesn't work if it depends on the contents
// of other collections, because it doesn't set up callbacks for changes in
// those collections)
export function denormalizedField({ needsUpdate, getValue }: {
  needsUpdate?: any,
  getValue: any,
}) {
  return {
    onUpdate: async ({data, document}) => {
      if (!needsUpdate || needsUpdate(data)) {
        return await getValue(document)
      }
    },
    onCreate: async ({newDocument}) => {
      if (!needsUpdate || needsUpdate(newDocument)) {
        return await getValue(newDocument)
      }
    },
    denormalized: true,
    canAutoDenormalize: true,
    optional: true,
    needsUpdate,
    getValue
  }
}

// Create a denormalized field which counts the number of objects in some other
// collection whose value for a field is this object's ID. For example, count
// the number of comments on a post, or the number of posts by a user, updating
// when objects are created/deleted/updated.
export function denormalizedCountOfReferences({ collectionName, fieldName, foreignCollectionName, foreignTypeName, foreignFieldName, filterFn }: {
  collectionName: CollectionNameString,
  fieldName: string,
  foreignCollectionName: string,
  foreignTypeName: string,
  foreignFieldName: string,
  filterFn?: any,
}) {
  const foreignCollectionCallbackPrefix = foreignTypeName.toLowerCase();
  
  if (!filterFn)
    filterFn = doc=>true;
  
  if (Meteor.isServer)
  {
    // When inserting a new document which potentially needs to be counted, follow
    // its reference and update with $inc.
    const createCallback = async (newDoc, {currentUser, collection, context}) => {
      if (newDoc[foreignFieldName] && filterFn(newDoc)) {
        const collection = getCollection(collectionName);
        await collection.update(newDoc[foreignFieldName], {
          $inc: { [fieldName]: 1 }
        });
      }
      
      return newDoc;
    }
    (createCallback as any).name = `${collectionName}_${fieldName}_countNew`;
    addCallback(`${foreignCollectionCallbackPrefix}.create.after`, createCallback);
    
    // When updating a document, we may need to decrement a count, we may
    // need to increment a count, we may need to do both with them cancelling
    // out, or we may need to both but on different documents.
    addCallback(`${foreignCollectionCallbackPrefix}.update.after`,
      async (newDoc, {oldDocument, currentUser, collection}) => {
        const countingCollection: any = getCollection(collectionName);
        if (filterFn(newDoc) && !filterFn(oldDocument)) {
          // The old doc didn't count, but the new doc does. Increment on the new doc.
          await countingCollection.update(newDoc[foreignFieldName], {
            $inc: { [fieldName]: 1 }
          });
        } else if (!filterFn(newDoc) && filterFn(oldDocument)) {
          // The old doc counted, but the new doc doesn't. Decrement on the old doc.
          await countingCollection.update(oldDocument[foreignFieldName], {
            $inc: { [fieldName]: -1 }
          });
        } else if(filterFn(newDoc) && oldDocument[foreignFieldName] !== newDoc[foreignFieldName]) {
          // The old and new doc both count, but the reference target has changed.
          // Decrement on one doc and increment on the other.
          await countingCollection.update(oldDocument[foreignFieldName], {
            $inc: { [fieldName]: -1 }
          });
          await countingCollection.update(newDoc[foreignFieldName], {
            $inc: { [fieldName]: 1 }
          });
        }
        return newDoc;
      }
    );
    addCallback(`${foreignCollectionCallbackPrefix}.delete.async`,
      async ({document, currentUser, collection}) => {
        if (document[foreignFieldName] && filterFn(document)) {
          const countingCollection = getCollection(collectionName);
          await countingCollection.update(document[foreignFieldName], {
            $inc: { [fieldName]: -1 }
          });
        }
      }
    );
  }
  
  return {
    type: Number,
    optional: true,
    defaultValue: 0,
    
    denormalized: true,
    canAutoDenormalize: true,
    
    getValue: async (document) => {
      const foreignCollection = getCollection(foreignCollectionName);
      const docsThatMayCount = await getWithLoader(
        foreignCollection,
        `denormalizedCount_${collectionName}.${fieldName}`,
        { },
        foreignFieldName,
        document._id
      );
      
      const docsThatCount = _.filter(docsThatMayCount, d=>filterFn(d));
      return docsThatCount.length;
    }
  }
}

export function googleLocationToMongoLocation(gmaps) {
  return {
    type: "Point",
    coordinates: [gmaps.geometry.location.lng, gmaps.geometry.location.lat]
  }
}
