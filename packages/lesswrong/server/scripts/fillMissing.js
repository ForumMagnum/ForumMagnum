import { Collections } from 'meteor/vulcan:core';

Vulcan.fillMissingValues = async () => {
  for (let i=0; i<Collections.length; i++) {
    const collection = Collections[i];
    if (!collection.simpleSchema) continue;
    const schema = collection.simpleSchema()._schema
    
    const fieldsWithAutofill = getFieldsWithAutofill(schema);
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
  for (let i=0; i<Collections.length; i++) {
    const collection = Collections[i];
    if (!collection.simpleSchema) continue;
    const schema = collection.simpleSchema()._schema;
    
    const fieldsWithAutofill = getFieldsWithAutofill(schema);
    if (fieldsWithAutofill.length == 0) continue;
    
    const count = countRowsNeedingAutofill(collection, fieldsWithAutofill);
    
    // eslint-disable-next-line no-console
    console.log(`${collection.collectionName}: ${count} rows with missing values`);
  }
}

function getFieldsWithAutofill(schema) {
  return _.filter(
      _.map(schema, (fieldSchema, fieldName) => fieldSchema.canAutofillDefault ? fieldName : null
    ), f => f!=null);
}

function countRowsNeedingAutofill(collection, fieldsWithAutofill)
{
  return collection.find({
    $or: _.map(fieldsWithAutofill, fieldName => ({[fieldName]: null}))
  }).count();
}
