import Users from 'meteor/vulcan:users';

export const generateIdResolverSingle = ({collectionName, fieldName}) => {
  return async (doc, args, context) => {
    if (!doc[fieldName]) return null

    const { currentUser } = context
    const collection = context[collectionName]
    const { checkAccess } = collection

    const resolvedDoc = await collection.loader.load(doc[fieldName])
    if (checkAccess && !checkAccess(currentUser, resolvedDoc)) return null
    const restrictedDoc = Users.restrictViewableFields(currentUser, collection, resolvedDoc)

    return restrictedDoc
  }
}

export const generateIdResolverMulti = ({collectionName, fieldName}) => {
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
      addOrginalField: true,
    },
  }
}

export const arrayOfForeignKeysField = ({idFieldName, resolverName, collectionName, type}) => {
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