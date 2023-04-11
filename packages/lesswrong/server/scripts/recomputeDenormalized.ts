import { Vulcan, Collections, getCollection } from '../vulcan-lib';
import { getFieldsWithAttribute } from './utils';
import { migrateDocuments } from '../manualMigrations/migrationUtils'
import { createAdminContext } from '../vulcan-lib/query';
import { getSchema } from '../../lib/utils/getSchema';
import * as _ from 'underscore';


export const recomputeAllDenormalizedValues = async () => {
  for(let collection of Collections) {
    await Vulcan.recomputeDenormalizedValues({
      collectionName: collection.options.collectionName
    })
  }
}
Vulcan.recomputeAllDenormalizedValues = recomputeAllDenormalizedValues;

export const validateAllDenormalizedValues = async () => {
  for(let collection of Collections) {
    await Vulcan.recomputeDenormalizedValues({
      collectionName: collection.options.collectionName,
      validateOnly: true
    })
  }
}
Vulcan.validateAllDenormalizedValues = validateAllDenormalizedValues;

// Recompute the value of denormalized fields (that are tagged with canAutoDenormalize).
// If validateOnly is true, compare them with the existing values in the database and
// report how many differ; otherwise update them to the correct values. If fieldName
// is given, recompute a single field; otherwise recompute all fields on the collection.
export const recomputeDenormalizedValues = async ({collectionName, fieldName=null, validateOnly=false}: {
  collectionName: CollectionNameString,
  fieldName?: string|null,
  validateOnly?: boolean,
}) => {
  // eslint-disable-next-line no-console
  console.log(`Recomputing denormalize values for ${collectionName} ${fieldName ? `and ${fieldName}` : ""}`)

  const collection = getCollection(collectionName)
  const schema: any = getSchema(collection);
  if (!schema) {
    // eslint-disable-next-line no-console
    console.log(`${collectionName} does not have a schema defined, not computing denormalized values`)
    return
  }

  if (fieldName) {
    if (!schema[fieldName]) {
      // eslint-disable-next-line no-console
      throw new Error(`${collectionName} does not have field ${fieldName}, not computing denormalized values`)
    }
    if (!schema[fieldName].denormalized) {
      throw new Error(`${collectionName}.${fieldName} is not marked as a denormalized field`)
    }
    if (!schema[fieldName].canAutoDenormalize) {
      throw new Error(`${collectionName}.${fieldName} is not marked as canAutoDenormalize`)
    }
    const getValue = schema[fieldName].getValue
    if (!getValue) {
      throw new Error(`${collectionName}.${fieldName} is missing its getValue function`)
    }

    await runDenormalizedFieldMigration({ collection, fieldName, getValue, validateOnly })
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
      await runDenormalizedFieldMigration({ collection, fieldName, getValue, validateOnly })
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Finished recomputing denormalized values for ${collectionName} ${fieldName ? `and ${fieldName}` : ""}`)
}
Vulcan.recomputeDenormalizedValues = recomputeDenormalizedValues;

async function runDenormalizedFieldMigration<T extends DbObject>({ collection, fieldName, getValue, validateOnly }: {
  collection: CollectionBase<T>,
  fieldName: keyof T,
  getValue: AnyBecauseTodo,
  validateOnly: boolean
}) {
  let numDifferent = 0;

  await migrateDocuments({
    description: `Recomputing denormalized values for ${collection.collectionName} field ${String(fieldName)}`,
    collection,
    batchSize: 100,
    migrate: async (documents) => {
      const context = createAdminContext();
      
      // eslint-disable-next-line no-console
      const updates = await Promise.all(documents.map(async doc => {
        const newValue = await getValue(doc, context)
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
      numDifferent += nonEmptyUpdates.length;

      // eslint-disable-next-line no-console
      console.log(`${nonEmptyUpdates.length} documents in batch with changing denormalized value`)
      if (!validateOnly) {
        if (nonEmptyUpdates.length > 0)  {
          await collection.rawCollection().bulkWrite(
            nonEmptyUpdates,
            { ordered: false }
          );
        }
      } else {
        // TODO: This is a hack, but better than leaving it. We're basically
        // breaking the expected API from migrateDocuments by supporting a
        // validateOnly option, so it does not offer us good hooks to do this.
        throw new Error([
          'Abort! validateOnly means the document will not change and the migration will never',
          'complete. This error is expected behavior to cause the migration to end.'
        ].join(' '))
      }
    },
  });

  // eslint-disable-next-line no-console
  console.log(`${numDifferent} total documents had wrong denormalized value`)
}

function isNullOrDefined(value: AnyBecauseTodo) {
  return value === null || value === undefined
}
