import { getFieldsWithAttribute } from './utils';
import { migrateDocuments, registerMigration } from '../manualMigrations/migrationUtils'
import { getSchema } from '../../lib/utils/getSchema';
import * as _ from 'underscore';
import { Collections } from "../vulcan-lib/getCollection";

registerMigration({
  name: "fillMissingValues",
  dateWritten: "2018-12-26",
  idempotent: true,
  action: async () => {
    for(let collection of Collections) {
      const schema = getSchema(collection);
      if (!schema) continue;
      
      const fieldsWithAutofill = getFieldsWithAttribute(schema, 'canAutofillDefault')
      if (fieldsWithAutofill.length === 0) continue;
      
      // eslint-disable-next-line no-console
      console.log(`Filling in missing values on ${collection.collectionName} in fields: ${fieldsWithAutofill}`);
  
      for (let fieldName of fieldsWithAutofill) {
        const defaultValue = schema[fieldName].defaultValue
        await migrateDocuments({
          description: `Filling in missing values for ${collection.collectionName} in field: ${fieldName} (default value: ${defaultValue})`,
          collection,
          unmigratedDocumentQuery: {
            [fieldName]: null,
          },
          batchSize: 1000,
          migrate: async (documents) => {
            const updates = documents.map(doc => ({
              updateOne: {
                filter: {_id: doc._id},
                update: {
                  $set: {
                    [fieldName]: defaultValue
                  }
                },
              }
            }))
            await collection.rawCollection().bulkWrite(
              updates,
              { ordered: false }
            );
          },
        });
      }
    }
  }
})

// Exported to allow running manually with "yarn repl"
export const checkForMissingValues = async () => {
  for(let collection of Collections) {
    const schema = getSchema(collection);
    if (!schema) continue;
    
    const fieldsWithAutofill = getFieldsWithAttribute(schema, 'canAutofillDefault')
    if (fieldsWithAutofill.length === 0) continue;
    
    const count = countRowsNeedingAutofill(collection, fieldsWithAutofill);
    
    // eslint-disable-next-line no-console
    console.log(`${collection.collectionName}: ${count} rows with missing values`);
  }
}

function countRowsNeedingAutofill<N extends CollectionNameString>(
  collection: CollectionBase<N>,
  fieldsWithAutofill: Array<string>,
) {
  return collection.find({
    $or: _.map(fieldsWithAutofill, (fieldName: string) => ({[fieldName]: null}))
  }).count();
}
