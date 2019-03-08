import Users from 'meteor/vulcan:users';
import SimpleSchema from 'simpl-schema'

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