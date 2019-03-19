import Users from 'meteor/vulcan:users';
import SimpleSchema from 'simpl-schema'

const generateIdResolverSingle = ({collectionName, fieldName}) => {
  return async (doc, args, context) => {
    if (!doc[fieldName]) return null

    const { currentUser } = context
    const collection = context[collectionName]
    const { checkAccess } = collection

    const resolvedDoc = await collection.loader.load(doc[fieldName])
    if (!resolvedDoc) {
      // eslint-disable-next-line no-console
      console.error(`Broken foreign key reference: ${collectionName}.${fieldName}=${doc[fieldName]}`);
      return null;
    }
    if (checkAccess && !checkAccess(currentUser, resolvedDoc)) return null
    const restrictedDoc = Users.restrictViewableFields(currentUser, collection, resolvedDoc)

    return restrictedDoc
  }
}

const generateIdResolverMulti = ({collectionName, fieldName}) => {
  return async (doc, args, context) => {
    if (!doc[fieldName]) return []

    const { currentUser } = context
    const collection = context[collectionName]
    const { checkAccess } = collection

    const resolvedDocs = await collection.loader.loadMany(doc[fieldName])
    const existingDocs = _.filter(resolvedDocs, d=>!!d);
    const filteredDocs = checkAccess ? _.filter(existingDocs, d => checkAccess(currentUser, d)) : resolvedDocs
    const restrictedDocs = Users.restrictViewableFields(currentUser, collection, filteredDocs)

    return restrictedDocs
  }
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
  else throw new Error("Invalid type in simplSchemaToGraphQLtype ");
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