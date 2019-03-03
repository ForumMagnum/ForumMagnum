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

export const addFieldsDict = (collection, fieldsDict) => {
  for (let key in fieldsDict) {
    collection.addField({
      fieldName: key,
      fieldSchema: fieldsDict[key]
    });
  }
}