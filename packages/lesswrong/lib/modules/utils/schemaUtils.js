import Users from 'meteor/vulcan:users';

export const generateIdResolverSingle = ({collectionName, fieldName}) => {
  return async (doc, args, context) => {
    if (!doc[fieldName]) return { result: null }

    const { currentUser } = context
    const collection = context[collectionName]
    const { checkAccess } = collection

    const resolvedDoc = await collection.loader.load(doc[fieldName])
    if (checkAccess && checkAccess(currentUser, resolvedDoc)) return { result: null }
    const restrictedDoc = Users.restrictViewableFields(currentUser, collection, resolvedDoc)

    return { result: restrictedDoc }
  }
}


export const generateIdResolverMulti = ({collectionName, fieldName}) => {
  return async (doc, args, context) => {
    if (!doc[fieldName]) return { results: [] }

    const { currentUser } = context
    const collection = context[collectionName]
    const { checkAccess } = collection

    const resolvedDocs = await collection.loader.loadMany(doc[fieldName])
    const filteredDocs = checkAccess ? _.filter(resolvedDocs, d => checkAccess(d, currentUser)) : resolvedDocs
    const restrictedDocs = Users.restrictViewableFields(currentUser, collection, filteredDocs)

    return { results: restrictedDocs }
  }
}
