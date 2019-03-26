/* global Vulcan */
import { Collections, getCollection } from 'meteor/vulcan:core';
import { getFieldsWithAttribute } from './utils';
import { migrateDocuments } from '../migrations/migrationUtils'

Vulcan.recomputeAllDenormalizedValues = async () => {
  for(let collection of Collections) {
    await Vulcan.recomputeDenormalizedValues(collection.options.collectionName)
  }
}

export const recomputeDenormalizedValues = async (collectionName, fieldName) => {
  // eslint-disable-next-line no-console
  console.log(`Recomputing denormalize values for ${collectionName} ${fieldName ? `and ${fieldName}` : ""}`)

  const collection = getCollection(collectionName)
  if (!collection.simpleSchema) {
    // eslint-disable-next-line no-console
    console.log(`${collectionName} does not have a schema defined, not computing denormalized values`)
    return
  }

  const schema = collection.simpleSchema()._schema
  if (fieldName) {
    if (!schema[fieldName]) {
      // eslint-disable-next-line no-console
      throw new Error(`${collectionName} does not have field ${fieldName}, not computing denormalized values`)
    }
    const getValue = schema[fieldName].getValue
    // eslint-disable-next-line no-console
    await runDenormalizedFieldMigration({ collection, fieldName, getValue })
  } else {
    const denormalizedFields = getFieldsWithAttribute(schema, 'canAutoDenormalize')
    if (denormalizedFields.length == 0) {
      // eslint-disable-next-line no-console
      console.log(`${collectionName} does not have any fields with "canAutoDenormalize", not computing denormalized values`)
      return;
    }
    
    // eslint-disable-next-line no-console
    console.log(`Recomputing denormalized values for ${collection.collectionName} in fields: ${denormalizedFields}`);
    
    for (let j=0; j<denormalizedFields.length; j++) {
      const fieldName = denormalizedFields[j];
      const getValue = schema[fieldName].getValue
      await runDenormalizedFieldMigration({ collection, fieldName, getValue })
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Finished recomputing denormalized values for ${collectionName} ${fieldName ? `and ${fieldName}` : ""}`)
}
Vulcan.recomputeDenormalizedValues = recomputeDenormalizedValues;

async function runDenormalizedFieldMigration({ collection, fieldName, getValue }) {
  await migrateDocuments({
    description: `Recomputing denormalized values for ${collection.collectionName} and field ${fieldName}`,
    collection,
    batchSize: 1000,
    migrate: async (documents) => {
      // eslint-disable-next-line no-console
      const updates = await Promise.all(documents.map(async doc => {
        const newValue = await getValue(doc)
        // If the correct value is already present, don't make a database update
        if ((isNullOrDefined(newValue) && isNullOrDefined(doc[fieldName])) || doc[fieldName] === newValue) return null
        return {
          updateOne: {
            filter: {_id: doc._id},
            update: {
              $set: {
                [fieldName]: newValue
              }
            },
          }
        }
      }))

      const nonEmptyUpdates = _.without(updates, null)
      // eslint-disable-next-line no-console
      console.log(`Updating ${nonEmptyUpdates.length} documents`)
      await collection.rawCollection().bulkWrite(
        nonEmptyUpdates,
        { ordered: false }
      );
    },
  });
}

function isNullOrDefined(value) {
  return value === null || value === undefined
}