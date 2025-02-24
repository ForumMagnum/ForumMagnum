import { forEachDocumentBatchInCollection } from '../manualMigrations/migrationUtils';
import { getSchema, getSimpleSchema } from '../../lib/utils/getSchema';
import { Vulcan } from "../../lib/vulcan-lib/config";
import { Collections, getCollection } from "../../lib/vulcan-lib/getCollection";

type CollectionCustomValidatorFunction<T extends DbObject> = (documents: T[], recordError: (field: string, message: string) => void) => Promise<void>;
type CollectionCustomValidator<T extends DbObject> = {
  name: string,
  validateBatch: CollectionCustomValidatorFunction<T>
}

// customValidators: Mapping from collection name to array of
// {validatorName,validateBatch} tuples.
let customValidators: Partial<Record<CollectionNameString, CollectionCustomValidator<any>[]>> = {};

// Register a function as a validator which can be run over data in the
// database, which will be run when validateDatabase is run (but not run
// automatically on mutations).
//
// async validateBatch(documents, recordError)
//   Takes an array of documents and a function for recording errors, returns
//   nothing. recordError takes a field name and an error description, and
//   groups errors together to be printed with counts.
export function registerCollectionValidator<N extends CollectionNameString>({collection, name, validateBatch}: {
  collection: CollectionBase<N>,
  name: string,
  validateBatch: CollectionCustomValidatorFunction<ObjectsByCollectionName[N]>
}) {
  if (!(collection.collectionName in customValidators))
    customValidators[collection.collectionName] = [];
  customValidators[collection.collectionName]!.push({name, validateBatch});
}

// Validate a collection against its attached schema. Checks that _id is always
// a string, that required fields are present, that unrecognized keys are not
// present, that fields are of the specified type, and that foreign-key fields
// point to rows that actually exist. (CAVEAT: foreign-key fields inside a
// nested schema are not currently handled, only top-level fields.)
//
// Outputs a summary of any problems found through console.log, and returns
// nothing.
export async function validateCollection(collection: AnyBecauseTodo)
{
  const collectionName = collection.collectionName;
  console.log(`Checking ${collectionName}`); // eslint-disable-line no-console
  const numRows = await collection.find({}).count();
  console.log(`    ${numRows} rows`); // eslint-disable-line no-console
  
  // Check for mixed _id type (string vs ObjectID)
  const rowsWithObjectID = await collection.find({
    _id: {$type: "objectId"}
  }).count();
  if (rowsWithObjectID > 0) {
    console.log(`    ${rowsWithObjectID} have keys of type ObjectID`); // eslint-disable-line no-console
  }
  
  // Validate rows
  const schema = getSchema(collection);
  if (!schema) {
    console.log(`    Collection does not have a schema`); // eslint-disable-line no-console
    return;
  }
  
  const validationContext = getSimpleSchema(collection).newContext();
  
  // Dictionary field=>type=>count
  const errorsByField: AnyBecauseTodo = {};
  
  function recordError(field: AnyBecauseTodo, errorType: AnyBecauseTodo) {
    let fieldGroupedByNums = field.replace(/[0-9]+/g, '<n>');
    
    if (!errorsByField[fieldGroupedByNums])
      errorsByField[fieldGroupedByNums] = {};
    if (!errorsByField[fieldGroupedByNums][errorType])
      errorsByField[fieldGroupedByNums][errorType] = 0;
    
    errorsByField[fieldGroupedByNums][errorType]++;
  }
  
  
  await forEachDocumentBatchInCollection({
    collection, batchSize: 10000,
    loadFactor: 0.5,
    callback: async (batch) => {
      // Validate documents against their batch with simpl-schema
      for (const document of batch) {
        validationContext.validate(document);
        
        if (!validationContext.isValid()) {
          let errors = validationContext.validationErrors();
          for (let error of errors) {
            recordError(error.name, error.type);
          }
        }
      }
      
      // If the collection has a custom validation function defined, run it
      if (collectionName in customValidators) {
        for (let validator of (customValidators as AnyBecauseTodo)[collectionName]) {
          try {
            await validator.validateBatch(batch, recordError);
          } catch(e) {
            console.error(e); //eslint-disable-line no-console
            recordError(validator.name, "Exception during validation");
          }
        }
      }
      
      // Iterate through fields checking for the foreignKey property (which
      // simpl-schema doesn't handle), and verifying that the keys actually
      // exist
      for (let fieldName in schema._schema) {
        // TODO: Nested-field foreign key constraints aren't yet supported
        if (fieldName.indexOf("$") >= 0)
          continue;
        
        const foreignKeySpec = (schema as AnyBecauseTodo)._schema[fieldName].foreignKey;
        
        if (foreignKeySpec) {
          // Get a list of foreign values to check for
          let foreignValuesDict: AnyBecauseTodo = {};
          for (const document of batch) {
            if ((document as AnyBecauseTodo)[fieldName])
              foreignValuesDict[(document as AnyBecauseTodo)[fieldName]] = true;
          }
          const foreignValues = Object.keys(foreignValuesDict);
          
          let foreignField, foreignCollectionName;
          if (typeof foreignKeySpec === "string") {
            foreignField = "_id";
            foreignCollectionName = foreignKeySpec;
          } else {
            foreignField = foreignKeySpec.field;
            foreignCollectionName = foreignKeySpec.collection
            if (typeof foreignField !== "string")
              throw new Error(`Expected a field name in foreignKey constraint for ${collectionName}.${fieldName}, value wasn't a string`);
            if (typeof foreignCollectionName !== "string")
              throw new Error(`Expected a collection name in foreignKey constraint for ${collectionName}.${fieldName}, value wasn't a string`);
          }
          const foreignCollection = getCollection(foreignCollectionName as AnyBecauseTodo);
          
          if (!foreignCollection) {
              //eslint-disable-next-line no-console
              console.error(`    Cannot find collection for foreign-key validation: ${foreignCollectionName}`);
              return;
          }
          
          // Get reduced versions of rows that the foreign-key field refers to
          const foreignRows = await foreignCollection.find({ [foreignField]: {$in: foreignValues} }, { [foreignField]:1 }).fetch()
          
          // Collect a list of values present
          const foreignValuesFound = {};
          for (const foreignRow of foreignRows)
            (foreignValuesFound as AnyBecauseTodo)[foreignRow[foreignField]] = true;
          
          // Compare against values referred to, and report an error for any missing
          for (const document of batch) {
            if ((document as AnyBecauseTodo)[fieldName] && !((document as AnyBecauseTodo)[fieldName] in foreignValuesFound)) {
              recordError(fieldName, `foreignKeyViolation: from ${document._id} to ${(document as AnyBecauseTodo)[fieldName]}`);
            }
          }
        }
      }
    }
  });
  
  for (const fieldName of Object.keys(errorsByField)) {
    for (const errorType of Object.keys(errorsByField[fieldName])) {
      const count = errorsByField[fieldName][errorType];
      console.log(`    ${collectionName}.${fieldName}: ${errorType} (${count} rows)`); //eslint-disable-line no-console
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
