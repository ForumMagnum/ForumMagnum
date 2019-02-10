/*global Vulcan*/

export function registerMigration({ name, idempotent, action })
{
  // The 'idempotent' parameter is mostly about forcing you to explicitly think
  // about migrations' idempotency and make them idempotent, and only
  // secondarily to enable the possibility of non-idempotent migrations later.
  // If you try to define a migration without marking it idempotent, throw an
  // error.
  if (!idempotent) {
    throw new Error(`Migration ${name} is not marked as idempotent; it can't use registerMigration unless it's marked as (and is) idempotent.`);
  }
  
  // Put the migration function in a dictionary Vulcan.migrations to make it
  // accessible in meteor shell, working around awkward inability to import
  // things non-relatively there.
  if (!Vulcan.migrations) {
    Vulcan.migrations = {};
  }
  
  Vulcan.migrations[name] = async () => {
    // eslint-disable-next-line no-console
    console.log(`Beginning migration: ${name}`);
    
    try {
      await action();
      
      // eslint-disable-next-line no-console
      console.log(`Finished migration: ${name}`);
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(`FAILED migration: ${name}.`);
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };
}

// Given a collection which has a field that has a default value (specified
// with ...schemaDefaultValue), fill in the default value for any rows where it
// is missing.
export async function fillDefaultValues({ collection, fieldName })
{
  if (!collection) throw new Error("Missing required argument: collection");
  if (!fieldName) throw new Error("Missing required argument: fieldName");
  const schema = collection.simpleSchema()._schema
  if (!schema) throw new Error(`Collection ${collection.collectionName} does not have a schema`);
  const defaultValue = schema[fieldName].defaultValue;
  if (defaultValue === undefined) throw new Error(`Field ${fieldName} does not have a default value`);
  if (!schema[fieldName].canAutofillDefault) throw new Error(`Field ${fieldName} is not marked autofillable`);

  // eslint-disable-next-line no-console
  console.log(`Filling in default values of ${collection.collectionName}.${fieldName}`);

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
  console.log(`Done. ${writeResult.nModified} rows affected`);
}

// Given a query which finds documents in need of a migration, and a function
// which takes a batch of documents and migrates them, repeatedly search for
// unmigrated documents and call the migrate function, until there are no
// unmigrated documents left.
//
// `migrate` should be a function which takes an array of documents (from a
// `collection.find`), and performs database operations to update them. After
// the update is performed, the documents should no longer match
// unmigratedDocumentQuery. (If they do, and the same document gets returned
// in any two consecutive queries, this will abort and throw an exception.
// However, this is not guaranteed to ever happen, because the
// unmigratedDocumentQuery is run without a sort criterion applied).
//
// No special effort is made to do locking or protect you from race conditions
// if things other than this migration script are happening on the same
// database. This function makes sense for filling in new denormalized fields,
// where figuring out the new field's value requires an additional query.
export async function migrateDocuments({ description, collection, batchSize, unmigratedDocumentQuery, migrate })
{
  // Validate arguments
  if (!collection) throw new Error("Missing required argument: collection");
  if (!unmigratedDocumentQuery) throw new Error("Missing required argument: unmigratedDocumentQuery");
  if (!migrate) throw new Error("Missing required argument: migrate");
  if (!batchSize || !(batchSize>0))
    throw new Error("Invalid batch size");
  
  if (!description)
    description = "Migration on "+collection.collectionName;
  
  // eslint-disable-next-line no-console
  console.log(`Beginning migration step: ${description}`);
  
  let previousDocumentIds = {};
  let documentsAffected = 0;
  
  // eslint-disable-next-line no-constant-condition
  while(true) {
    let documents = collection.find(unmigratedDocumentQuery, {limit: batchSize}).fetch();
    
    if (!documents.length)
      break;
    
    // Check if any of the documents returned were supposed to have been
    // migrated by the previous batch's update operation.
    let docsNotMigrated = _.filter(documents, doc => previousDocumentIds[doc._id]);
    if (docsNotMigrated.length > 0) {
      let errorMessage = `Documents not updated in migrateDocuments: ${_.map(docsNotMigrated, doc=>doc._id)}`;
      
      // eslint-disable-next-line no-console
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    previousDocumentIds = {};
    _.each(documents, doc => previousDocumentIds[doc._id] = true);
    
    // Migrate documents in the batch
    try {
      await migrate(documents);
      
      documentsAffected += documents.length;
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error("Error running migration");
      // eslint-disable-next-line no-console
      console.error(e);
      throw(e);
    }
  }
  
  // eslint-disable-next-line no-console
  console.log(`Finished migration step: ${description}. ${documentsAffected} documents affected.`);
}
