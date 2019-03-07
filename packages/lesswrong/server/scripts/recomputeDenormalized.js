/* global Vulcan */
import { Collections, getCollection } from 'meteor/vulcan:core';
import { getFieldsWithAttribute } from './utils';
import { migrateDocuments } from '../migrations/migrationUtils'

Vulcan.recomputeAllDenormalizedValues = async () => {
  for(let collection of Collections) {
    await Vulcan.recomputeDenormalizedValues(collection.options.collectionName)
  }
}

Vulcan.recomputeDenormalizedValues = async (collectionName, fieldName) => {
  // eslint-disable-next-line no-console
  console.log(`Recomputing denormalize values for ${collectionName} ${fieldName && `and ${fieldName}`}`)

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
  console.log(`Finished recomputing denormalized values for ${collectionName} ${fieldName && `and ${fieldName}`}`)
}

async function runDenormalizedFieldMigration({ collection, fieldName, getValue }) {
  await migrateDocuments({
    description: `Recomputing denormalized values for ${collection.collectionName}`,
    collection,
    batchSize: 100,
    migrate: async (documents) => {
      const updates = Promise.all(documents.map(async doc => {
        return {
          updateOne: {
            filter: {_id: doc._id},
            update: {
              $set: {
                [fieldName]: await getValue(doc)
              }
            },
          }
        }
      }))
      await collection.rawCollection().bulkWrite(
        updates,
        { ordered: false }
      );
    },
  });
}