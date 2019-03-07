/* global Vulcan */
import { Collections } from 'meteor/vulcan:core';
import { getFieldsWithAttribute } from './utils';

Vulcan.fillMissingValues = async () => {
  for(let collection of Collections) {
    if (!collection.simpleSchema) continue;
    const schema = collection.simpleSchema()._schema
    
    const fieldsWithAutofill = getFieldsWithAttribute(schema, 'canAutofillDefault')
    if (fieldsWithAutofill.length == 0) continue;
    
    // eslint-disable-next-line no-console
    console.log(`Filling in missing values on ${collection.collectionName} in fields: ${fieldsWithAutofill}`);
    
    for (let j=0; j<fieldsWithAutofill.length; j++) {
      const fieldName = fieldsWithAutofill[j];
      const defaultValue = schema[fieldName].defaultValue;
      
      const writeResult = await collection.update({
        [fieldName]: null
      }, {
        $set: {
          [fieldName]: defaultValue
        }
      }, {
        multi: true,
      });
      
      // eslint-disable-next-line no-console
      console.log(`    ${fieldName} => ${defaultValue} (${writeResult.nModified} times)`);
    }
  }
}

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
