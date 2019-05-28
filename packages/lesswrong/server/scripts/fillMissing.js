/* global Vulcan */
import { Collections } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments'
import { getFieldsWithAttribute } from './utils';
import { migrateDocuments, registerMigration } from '../migrations/migrationUtils'

registerMigration({
  name: "fillMissingValues",
  idempotent: true,
  action: async () => {
    for(let collection of [Comments]) {
      if (!collection.simpleSchema) continue;
      const schema = collection.simpleSchema()._schema
      
      // const fieldsWithAutofill = getFieldsWithAttribute(schema, 'canAutofillDefault')
      const fieldsWithAutofill = ['authorIsUnreviewed']
      if (fieldsWithAutofill.length == 0) continue;
      
      // eslint-disable-next-line no-console
      console.log(`Filling in missing values on ${collection.collectionName} in fields: ${fieldsWithAutofill}`);
  
      for (let fieldName of fieldsWithAutofill) {
        // console.log('schema aiu', schema.authorIsUnreviewed)
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

Vulcan.checkForMissingValues = async () => {
  for(let collection of Collections) {
    if (!collection.simpleSchema) continue;
    const schema = collection.simpleSchema()._schema;
    
    const fieldsWithAutofill = getFieldsWithAttribute(schema, 'canAutofillDefault')
    if (fieldsWithAutofill.length == 0) continue;
    
    const count = countRowsNeedingAutofill(collection, fieldsWithAutofill);
    
    // eslint-disable-next-line no-console
    console.log(`${collection.collectionName}: ${count} rows with missing values`);
  }
}

function countRowsNeedingAutofill(collection, fieldsWithAutofill)
{
  return collection.find({
    $or: _.map(fieldsWithAutofill, fieldName => ({[fieldName]: null}))
  }).count();
}
