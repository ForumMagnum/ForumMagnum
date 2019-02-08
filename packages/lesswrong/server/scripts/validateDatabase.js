/* global Vulcan */
import { Collections } from 'meteor/vulcan:lib';

// Given a collection and a batch size, run a callback for each row in the
// collection, grouped into batches of up to the given size. Rows created or
// deleted while this is running might or might not get included (neither is
// guaranteed).
//
// This works by querying a range of IDs, with a limit, and using the largest
// ID from each batch to find the start of the interval for the next batch.
// This expects that `max` is a sensible operation on IDs, treated the same
// way in Javascript as in Mongo; which translates into the assumption that IDs
// are homogenously string typed. Ie, this function will break if some rows
// have _id of type ObjectID instead of string.
export async function forEachDocumentBatchInCollection({collection, batchSize, callback})
{
  let rows = collection.find({}, {limit: batchSize});
  
  do {
    callback(rows);
    
    const lastID = _.max(rows, row => row._id);
    rows = await collection.find(
      { _id: {$gt: lastID} },
      { limit: batchSize }
    );
  } while(rows.length > 0)
}

// Validate a collection against its attached schema. Checks that _id is always
// a string, that required fields are present, that unrecognized keys are not
// present, and that fields are of the specified type. Outputs a summary of any
// problems found through console.log, and returns nothing.
export async function validateCollection(collection)
{
  const collectionName = collection.collectionName;
  console.log(`Checking ${collectionName}`); // eslint-disable-line
  const numRows = await collection.rawCollection().count();
  console.log(`    ${numRows} rows`); // eslint-disable-line
  
  // Check for mixed _id type (string vs ObjectID)
  const rowsWithObjectID = await collection.rawCollection().count({
    _id: {$type: "objectId"}
  });
  if (rowsWithObjectID > 0) {
    console.log(`    ${rowsWithObjectID} have keys of type ObjectID`); // eslint-disable-line
  }
  
  // Validate rows
  const schema = collection.simpleSchema();
  if (!schema) {
    console.log(`    Collection does not have a schema`); // eslint-disable-line
    return;
  }
  
  const validationContext = schema.newContext();
  
  // Dictionary field=>type=>count
  const errorsByField = {};
  
  await forEachDocumentBatchInCollection({
    collection, batchSize: 10000,
    callback: (batch) => {
      for (const document of batch) {
        validationContext.validate(document);
        
        if (!validationContext.isValid()) {
          let errors = validationContext.validationErrors();
          for (let error of errors) {
            if (!errorsByField[error.name])
              errorsByField[error.name] = {};
            if (!errorsByField[error.name][error.type])
              errorsByField[error.name][error.type] = 0;
            
            errorsByField[error.name][error.type]++;
          }
        }
      }
    }
  });
  
  for (const fieldName of Object.keys(errorsByField)) {
    for (const errorType of Object.keys(errorsByField[fieldName])) {
      const count = errorsByField[fieldName][errorType];
      console.log(`    ${collectionName}.${fieldName}: ${errorType} (${count} rows)`); //eslint-disable-line
    }
  }
}

// Validate each collection in the database against their attached schemas.
// Outputs a summary of the results through console.log, and returns nothing.
export async function validateDatabase()
{
  for (let collection of Collections)
  {
    await validateCollection(collection);
  }
}

Vulcan.validateCollection = validateCollection;
Vulcan.validateDatabase = validateDatabase;
