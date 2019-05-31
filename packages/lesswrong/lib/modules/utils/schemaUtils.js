import Users from 'meteor/vulcan:users';
import SimpleSchema from 'simpl-schema'

const generateIdResolverSingle = ({collectionName, fieldName}) => {
  return async (doc, args, context) => {
    if (!doc[fieldName]) return null

    const { currentUser } = context
    const collection = context[collectionName]

    const resolvedDoc = await collection.loader.load(doc[fieldName])
    if (!resolvedDoc) {
      // eslint-disable-next-line no-console
      console.error(`Broken foreign key reference: ${collectionName}.${fieldName}=${doc[fieldName]}`);
      return null;
    }

    return accessFilterSingle(currentUser, collection, resolvedDoc);
  }
}

const generateIdResolverMulti = ({collectionName, fieldName}) => {
  return async (doc, args, context) => {
    if (!doc[fieldName]) return []

    const { currentUser } = context
    const collection = context[collectionName]

    const resolvedDocs = await collection.loader.loadMany(doc[fieldName])

    return accessFilterMultiple(currentUser, collection, resolvedDocs);
  }
}

// Apply both document-level and field-level permission checks to a single document.
// If the user can't access the document, returns null. If the user can access the
// document, return a copy of the document in which any fields the user can't access
// have been removed. If document is null, returns null.
export const accessFilterSingle = (currentUser, collection, document) => {
  const { checkAccess } = collection
  if (!document) return null;
  if (checkAccess && !checkAccess(currentUser, document)) return null
  const restrictedDoc = Users.restrictViewableFields(currentUser, collection, document)
  return restrictedDoc;
}

// Apply both document-level and field-level permission checks to a list of documents.
// Returns a list where documents which the user can't access are removed from the
// list, and fields which the user can't access are removed from the documents inside
// the list. If currentUser is null, applies permission checks for the logged-out
// view.
export const accessFilterMultiple = (currentUser, collection, unfilteredDocs) => {
  const { checkAccess } = collection
  
  // Filter out nulls (docs that were referenced but didn't exist)
  const existingDocs = _.filter(unfilteredDocs, d=>!!d);
  // Apply the collection's checkAccess function, if it has one, to filter out documents
  const filteredDocs = checkAccess ? _.filter(existingDocs, d => checkAccess(currentUser, d)) : existingDocs
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

export const arrayOfForeignKeysField = ({idFieldName, resolverName, collectionName, type}) => {
  if (!idFieldName || !resolverName || !collectionName || !type)
    throw new Error("Missing argument to foreignKeyField");
  
  return {
    type: Array,
    resolveAs: {
      fieldName: resolverName,
      type: `[${type}]`,
      resolver: generateIdResolverMulti({
        collectionName,
        fieldName: idFieldName
      }),
      addOriginalField: true
    },
  }
}

const simplSchemaToGraphQLtype = (type) => {
  if (type === String) return "String";
  else if (type === Number) return "Int";
  else if (type === Date) return "Date";
  else if (type === Boolean) return "Boolean";
  else throw new Error("Invalid type in simplSchemaToGraphQLtype");
}

export const resolverOnlyField = ({type, graphQLtype=null, resolver, ...rest}) => {
  return {
    type: type,
    optional: true,
    resolveAs: {
      type: graphQLtype || simplSchemaToGraphQLtype(type),
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
  let translatedFields = [];
  for (let key in fieldsDict) {
    translatedFields.push({
      fieldName: key,
      fieldSchema: fieldsDict[key]
    });
  }
  collection.addField(translatedFields);
}

// For denormalized fields, getValue returns the new denormalized value of
// the field, given the new document after an update or an insert
SimpleSchema.extendOptions(['needsUpdate'])

// For denormalized fields, needsUpdate is an optional attribute that 
// determines whether the denormalization function should be rerun given
// the new document after an update or an insert
SimpleSchema.extendOptions(['getValue'])

// For denormalized fields, marks a field so that we can automatically 
// get the automatically recompute the new denormalized value via
// `Vulcan.recomputeDenormalizedValues` in the Meteor shell
SimpleSchema.extendOptions(['canAutoDenormalize'])


// Helper function to add all the correct callbacks and metainfo to make fields denormalized
export function denormalizedField({ needsUpdate, getValue }) {
  return {
    onUpdate: async ({data, newDocument}) => {
      if (!needsUpdate || needsUpdate(data)) {
        return await getValue(newDocument)
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
