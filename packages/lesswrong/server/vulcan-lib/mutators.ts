/*

Mutations have five steps:

1. Validation

If the mutator call is not trusted (for example, it comes from a GraphQL mutation),
we'll run all validate steps:

- Check that the current user has permission to insert/edit each field.
- Add userId to document (insert only).
- Run validation callbacks.

2. Before Callbacks

The second step is to run the mutation argument through all the [before] callbacks.

3. Operation

We then perform the insert/update/remove operation.

4. After Callbacks

We then run the mutation argument through all the [after] callbacks.

5. Async Callbacks

Finally, *after* the operation is performed, we execute any async callbacks.

*/

import { convertDocumentIdToIdInSelector } from '../../lib/vulcan-lib/utils';
import { validateDocument, validateData, dataToModifier, modifierToData, } from './validation';
import { getSchema } from '../../lib/utils/getSchema';
import { throwError } from './errors';
import { getCollectionHooks, CreateCallbackProperties, UpdateCallbackProperties, DeleteCallbackProperties, AfterCreateCallbackProperties } from '../mutationCallbacks';
import clone from 'lodash/clone';
import isEmpty from 'lodash/isEmpty';
import { createError } from 'apollo-errors';
import pickBy from 'lodash/pickBy';
import { loggerConstructor } from '../../lib/utils/logging';
// This needs to be import type to avoid a dependency cycle
import type {
  runCreateBeforeEditableCallbacks as runCreateBeforeEditableCallbacksType,
  runCreateAfterEditableCallbacks as runCreateAfterEditableCallbacksType,
  runNewAsyncEditableCallbacks as runNewAsyncEditableCallbacksType,
  runUpdateBeforeEditableCallbacks as runUpdateBeforeEditableCallbacksType,
  runUpdateAfterEditableCallbacks as runUpdateAfterEditableCallbacksType,
  runEditAsyncEditableCallbacks as runEditAsyncEditableCallbacksType,
} from '../editor/make_editable_callbacks';
import { runCountOfReferenceCallbacks } from '../callbacks/countOfReferenceCallbacks';
import { isElasticEnabled } from '@/lib/instanceSettings';
import { searchIndexedCollectionNamesSet } from '@/lib/search/searchUtil';
// This needs to be import type to avoid a dependency cycle
import type { elasticSyncDocument as elasticSyncDocumentType } from '../search/elastic/elasticCallbacks';

const mutatorParamsToCallbackProps = <N extends CollectionNameString>(
  createMutatorParams: CreateMutatorParams<N>,
): CreateCallbackProperties<N> => {
  const {
    currentUser = null,
    collection,
    document
  } = createMutatorParams;

  const schema = getSchema(collection);

  return {
    currentUser, collection,
    context: createMutatorParams.context ?? require('./query').createAnonymousContext(),
    document: document as DbInsertion<ObjectsByCollectionName[N]>, // Pretend this isn't Partial
    newDocument: document as DbInsertion<ObjectsByCollectionName[N]>, // Pretend this isn't Partial
    schema
  };
};

/**
 * Validation logic used by {@link createMutator}.  Factored out because we also need it for debate comments.
 * Keep in mind that this doesn't just validate the document against its schema, it also runs all the validation callbacks.
 * Those may have side effects, depending on the collection!  If they do, you probably shouldn't use this.
 * (Let's please not write any more validation callbacks with side effects.)
 */
export const validateCreateMutation = async <N extends CollectionNameString>(
  mutatorParams: CreateMutatorParams<N>,
) => {
  let { document } = mutatorParams;
  const callbackProperties = mutatorParamsToCallbackProps(mutatorParams);
  const { collection, context } = callbackProperties;

  const hooks = getCollectionHooks(collection.collectionName);
  
  let validationErrors: Array<any> = [];
  validationErrors = validationErrors.concat(validateDocument(document, collection, context));
  // run validation callbacks
  validationErrors = await hooks.createValidate.runCallbacks({
    iterator: validationErrors,
    properties: [callbackProperties],
    ignoreExceptions: false,
  });
  if (validationErrors.length) {
    console.log(validationErrors); // eslint-disable-line no-console
    throwError({ id: 'app.validation_error', data: { break: true, errors: validationErrors } });
  }

  return document;
};

/**
 * Create mutation
 * Inserts an entry in a collection, and runs a bunch of callback functions to
 * fill in its denormalized fields etc. Input is a Partial<T>, because some
 * fields will be filled in by those callbacks; result is a T, but nothing
 * in the type system ensures that everything actually gets filled in. 
 */
export const createMutator: CreateMutator = async <N extends CollectionNameString>(
  createMutatorParams: CreateMutatorParams<N>,
) => {
  let {
    collection,
    document,
    currentUser=null,
    validate=true,
  } = createMutatorParams;
  const logger = loggerConstructor(`mutators-${collection.collectionName.toLowerCase()}`);
  logger('createMutator() begin')
  logger('(new) document', document);
  // If no context is provided, create a new one (so that callbacks will have
  // access to loaders)
  const context = createMutatorParams.context ?? require('./query').createAnonymousContext();

  const { collectionName } = collection;
  const schema = getSchema(collection);

  const hooks = getCollectionHooks(collectionName);

  // There are some functions we need to run in various mutator stages which themselves call mutators somewhere,
  // so to avoid dependency cycles we need to dynamically import them.
  const { runCreateBeforeEditableCallbacks, runCreateAfterEditableCallbacks, runNewAsyncEditableCallbacks }: {
    runCreateBeforeEditableCallbacks: typeof runCreateBeforeEditableCallbacksType,
    runCreateAfterEditableCallbacks: typeof runCreateAfterEditableCallbacksType,
    runNewAsyncEditableCallbacks: typeof runNewAsyncEditableCallbacksType,
  } = require('../editor/make_editable_callbacks');

  const { elasticSyncDocument }: {
    elasticSyncDocument: typeof elasticSyncDocumentType,
  } = require('../search/elastic/elasticCallbacks');

  /*

  Properties

  Note: keep newDocument for backwards compatibility

  */
  const properties = mutatorParamsToCallbackProps(createMutatorParams);

  /*

  Validation

  */
  if (validate) {
    document = await validateCreateMutation(createMutatorParams);
  } else {
    logger('skipping validation')
  }

  // userId
  // 
  // If user is logged in, check if userId field is in the schema and add it to
  // document if needed.
  // FIXME: This is a horrible hack; there's no good reason for this not to be
  // using the same callbacks as everything else.
  if (currentUser) {
    const userIdInSchema = Object.keys(schema).find(key => key === 'userId');
    if (!!userIdInSchema && !(document as any).userId) {
      (document as any).userId = currentUser._id;
    }
  }

  /*

  onCreate

  note: cannot use forEach with async/await.
  See https://stackoverflow.com/a/37576787/649299

  note: clone arguments in case callbacks modify them

  */
  logger('field onCreate callbacks')
  const start = Date.now();
  for (let fieldName of Object.keys(schema)) {
    let autoValue;
    const schemaField = schema[fieldName];
    if (schemaField.onCreate) {
      // OpenCRUD backwards compatibility: keep both newDocument and data for now, but phase out newDocument eventually
      // eslint-disable-next-line no-await-in-loop
      autoValue = await schemaField.onCreate({...properties, fieldName} as any); // eslint-disable-line no-await-in-loop
    }
    if (typeof autoValue !== 'undefined') {
      logger(`onCreate returned a value to insert for field ${fieldName}: ${autoValue}`)
      Object.assign(document, { [fieldName]: autoValue });
    }
  }
  const timeElapsed = Date.now() - start;
  // Technically these aren't callbacks, but for the purpose of analytics we want to treat them the same way
  // Temporarily disabled to investigate performance issues
  // captureEvent('callbacksCompleted', {
  //   callbackHookName: `${collectionName.toLowerCase()}.oncreate`,
  //   timeElapsed
  // }, true);

  // TODO: find that info in GraphQL mutations
  // if (isServer && this.connection) {
  //   post.userIP = this.connection.clientAddress;
  //   post.userAgent = this.connection.httpHeaders['user-agent'];
  // }

  /*

  Before

  */
  logger('before callbacks')
  logger('createBefore')
  document = await hooks.createBefore.runCallbacks({
    iterator: document as DbInsertion<ObjectsByCollectionName[N]>, // Pretend this isn't Partial
    properties: [properties],
  }) as Partial<DbInsertion<ObjectsByCollectionName[N]>>;

  document = await runCreateBeforeEditableCallbacks({
    doc: document,
    props: properties,
  });

  logger('newSync')
  document = await hooks.newSync.runCallbacks({
    iterator: document as DbInsertion<ObjectsByCollectionName[N]>, // Pretend this isn't Partial
    properties: [currentUser, context]
  }) as Partial<DbInsertion<ObjectsByCollectionName[N]>>;

  /*

  DB Operation

  */
  logger('inserting into database');
  const insertedId = await collection.rawInsert(document as ObjectsByCollectionName[N]);
  const documentWithId = {_id: insertedId, ...document} as ObjectsByCollectionName[N];
  const afterCreateProperties: AfterCreateCallbackProperties<N> = {...properties, document: documentWithId, newDocument: documentWithId};

  /*

  After

  */
  // run any post-operation sync callbacks
  logger('after callbacks')
  logger('createAfter')
  document = await hooks.createAfter.runCallbacks({
    iterator: document as ObjectsByCollectionName[N], // Pretend this isn't Partial
    properties: [afterCreateProperties],
  }) as Partial<DbInsertion<ObjectsByCollectionName[N]>>;

  // I don't like the casts, but it's what we were doing in `createAfter` callbacks before we pulled out the editable callbacks
  document = await runCreateAfterEditableCallbacks({
    newDoc: document as ObjectsByCollectionName[N],
    props: afterCreateProperties,
  }) as Partial<DbInsertion<ObjectsByCollectionName[N]>>;
  
  // This should happen after the editable callbacks
  await runCountOfReferenceCallbacks({
    collectionName,
    newDocument: document,
    callbackStage: "createAfter",
    afterCreateProperties,
  });

  logger('newAfter')
  // OpenCRUD backwards compatibility
  document = await hooks.newAfter.runCallbacks({
    iterator: document as ObjectsByCollectionName[N], // Pretend this isn't Partial
    properties: [currentUser, afterCreateProperties]
  }) as Partial<DbInsertion<ObjectsByCollectionName[N]>>;

  // note: query for document to get fresh document with collection-hooks effects applied
  let completedDocument = document as ObjectsByCollectionName[N];
  const queryResult = await collection.findOne(insertedId);
  if (queryResult)
    completedDocument = queryResult;

  /*

  Async

  */
  // note: make sure properties.document is up to date
  logger('async callbacks')
  logger('createAsync')
  await hooks.createAsync.runCallbacksAsync(
    [{ ...afterCreateProperties, document: completedDocument, newDocument: completedDocument }],
  );

  if (isElasticEnabled && searchIndexedCollectionNamesSet.has(collectionName)) {
    void elasticSyncDocument(collectionName, insertedId);
  }

  logger('newAsync')
  // OpenCRUD backwards compatibility
  await hooks.newAsync.runCallbacksAsync([
    completedDocument,
    currentUser,
    collection,
    afterCreateProperties,
  ]);

  await runNewAsyncEditableCallbacks({
    newDoc: completedDocument,
    props: afterCreateProperties,
  });

  return { data: completedDocument };
};

/**
 * Update mutation
 * Updates a single database entry, and runs callbacks/etc to update its
 * denormalized fields. The preferred way to do this is with a documentId;
 * in theory you can use a selector, but you should only do this if you're sure
 * there's only one matching document (eg, slug). Returns the modified document.
 */
export const updateMutator: UpdateMutator = async <N extends CollectionNameString>({
  collection,
  documentId,
  selector,
  data: dataParam,
  set = {},
  unset = {},
  currentUser=null,
  validate=true,
  context: maybeContext,
  document: oldDocument,
}: UpdateMutatorParams<N>) => {
  const { collectionName } = collection;
  const schema = getSchema(collection);
  const logger = loggerConstructor(`mutators-${collectionName.toLowerCase()}`);
  logger('updateMutator() begin')

  // If no context is provided, create a new one (so that callbacks will have
  // access to loaders)
  const context = maybeContext ?? require('./query').createAnonymousContext();

  // OpenCRUD backwards compatibility
  selector = selector || { _id: documentId };
  let data = dataParam || modifierToData({ $set: set, $unset: unset });
  logger('update data', data)
  
  // Save the original mutation (before callbacks add more changes to it) for
  // logging in LWEvents
  let origData = {...data};

  const hooks = getCollectionHooks(collectionName);

  const { runUpdateBeforeEditableCallbacks, runUpdateAfterEditableCallbacks, runEditAsyncEditableCallbacks }: {
    runUpdateBeforeEditableCallbacks: typeof runUpdateBeforeEditableCallbacksType,
    runUpdateAfterEditableCallbacks: typeof runUpdateAfterEditableCallbacksType,
    runEditAsyncEditableCallbacks: typeof runEditAsyncEditableCallbacksType,
  } = require('../editor/make_editable_callbacks');

  const { elasticSyncDocument }: {
    elasticSyncDocument: typeof elasticSyncDocumentType,
  } = require('../search/elastic/elasticCallbacks');

  if (isEmpty(selector)) {
    throw new Error('Selector cannot be empty');
  }

  // get original document from database or arguments
  oldDocument = oldDocument || (await collection.findOne(convertDocumentIdToIdInSelector(selector)));

  if (!oldDocument) {
    throw new Error(`Could not find document to update for selector: ${JSON.stringify(selector)}`);
  }

  // get a "preview" of the new document
  let document: ObjectsByCollectionName[N] = { ...oldDocument, ...data };
  // FIXME: Filtering out null-valued fields here is a very sketchy, probably
  // wrong thing to do. This originates from Vulcan, and it's not clear why it's
  // doing it. Explicit cast to make it type-check anyways.
  document = pickBy(document, f => f !== null) as any;

  /*

  Properties

  */
  const properties: UpdateCallbackProperties<N> = {
    data: data||{},
    oldDocument,
    document,
    newDocument: document,
    currentUser, collection, context, schema
  };

  /*

  Validation

  */
  if (validate) {
    logger('validating')
    let validationErrors: any = [];

    validationErrors = validationErrors.concat(validateData(data, document, collection, context));

    validationErrors = await hooks.updateValidate.runCallbacks({
      iterator: validationErrors,
      properties: [properties],
      ignoreExceptions: false,
    });

    // LESSWRONG - added custom message (showing all validation errors instead of a generic message)
    if (validationErrors.length) {
      // eslint-disable-next-line no-console
      console.log('// validationErrors:', validationErrors);
      const EditDocumentValidationError = createError('app.validation_error', {message: JSON.stringify(validationErrors)});
      throw new EditDocumentValidationError({data: { break: true, errors: validationErrors }});
    }
  } else {
    logger('skipping validation')
  }

  /*

  onUpdate

  */
  logger('field onUpdate callbacks')
  const dataAsModifier = dataToModifier(clone(data));
  for (let fieldName of Object.keys(schema)) {
    let autoValue;
    const schemaField = schema[fieldName];
    if (schemaField.onUpdate) {
      autoValue = await schemaField.onUpdate({...properties, fieldName, modifier: dataAsModifier});
    }
    if (typeof autoValue !== 'undefined') {
      logger(`onUpdate returned a value to update for ${fieldName}: ${autoValue}`)
      data![fieldName] = autoValue;
    }
  }

  /*

  Before

  */
  logger('before callbacks')
  logger('updateBefore')
  data = await hooks.updateBefore.runCallbacks({
    iterator: data,
    properties: [properties],
  });

  data = await runUpdateBeforeEditableCallbacks({
    docData: data,
    props: properties,
  });

  logger('editSync')
  data = modifierToData(
    await hooks.editSync.runCallbacks({
      iterator: dataToModifier(data),
      properties: [
        oldDocument,
        currentUser,
        document,
        properties,
      ]
    })
  );

  // update connector requires a modifier, so get it from data
  const modifier = dataToModifier(data);

  // remove empty modifiers
  if (isEmpty(modifier.$set)) {
    delete modifier.$set;
  }
  if (isEmpty(modifier.$unset)) {
    delete modifier.$unset;
  }

  /*

  DB Operation

  */
  if (!isEmpty(modifier)) {
    // update document
    logger('updating document')
    await collection.rawUpdateOne(convertDocumentIdToIdInSelector(selector), modifier);

    // get fresh copy of document from db
    const fetched = await collection.findOne(convertDocumentIdToIdInSelector(selector));
    if (!fetched)
      throw new Error("Could not find updated document after applying update");
    document = fetched;

    // TODO: add support for caching by other indexes to Dataloader
    // https://github.com/VulcanJS/Vulcan/issues/2000
    // clear cache if needed
    if (selector.documentId && context) {
      context.loaders[collectionName].clear(selector.documentId);
    }
  }

  /*

  After

  */
  logger('after callbacks')
  logger('updateAfter')
  document = await hooks.updateAfter.runCallbacks({
    iterator: document,
    properties: [properties],
  });

  document = await runUpdateAfterEditableCallbacks({
    newDoc: document,
    props: properties,
  });
  
  // This should happen after the editable callbacks
  await runCountOfReferenceCallbacks({
    collectionName,
    newDocument: document,
    callbackStage: "updateAfter",
    updateAfterProperties: properties,
  });

  /*

  Async

  */
  // run async callbacks
  logger('async callbacks')
  logger('updateAsync')
  await hooks.updateAsync.runCallbacksAsync([properties]);
  // OpenCRUD backwards compatibility
  logger('editAsync')
  await hooks.editAsync.runCallbacksAsync([
    document,
    oldDocument,
    currentUser,
    collection,
    properties,
  ]);

  await runEditAsyncEditableCallbacks({
    newDoc: document,
    props: properties,
  });

  if (isElasticEnabled && searchIndexedCollectionNamesSet.has(collectionName)) {
    void elasticSyncDocument(collectionName, document._id);
  }
  
  void require('../fieldChanges').logFieldChanges({currentUser, collection, oldDocument, data: origData});

  return { data: document };
};

//
// Delete mutation
// Deletes a single database entry, and runs any callbacks/etc that trigger on
// that. Returns the entry that was deleted.
//
export const deleteMutator: DeleteMutator = async <N extends CollectionNameString>({
  collection,
  documentId,
  selector,
  currentUser=null,
  validate=true,
  context: maybeContext,
  document,
}: DeleteMutatorParams<N>) => {
  const { collectionName } = collection;
  const schema = getSchema(collection);
  // OpenCRUD backwards compatibility
  selector = selector || { _id: documentId };

  const hooks = getCollectionHooks(collectionName);

  // If no context is provided, create a new one (so that callbacks will have
  // access to loaders)
  const context = maybeContext ?? require('./query').createAnonymousContext();

  if (isEmpty(selector)) {
    throw new Error('Selector cannot be empty');
  }

  document = document || (await collection.findOne(convertDocumentIdToIdInSelector(selector)));

  if (!document) {
    throw new Error(`Could not find document to delete for selector: ${JSON.stringify(selector)}`);
  }

  /*

  Properties

  */
  const properties: DeleteCallbackProperties<N> = { document, currentUser, collection, context, schema };

  /*

  Validation

  */
  if (validate) {
    let validationErrors: any = [];

    validationErrors = await hooks.deleteValidate.runCallbacks({
      iterator: validationErrors,
      properties: [properties],
      ignoreExceptions: false,
    });

    if (validationErrors.length) {
      console.log(validationErrors); // eslint-disable-line no-console
      throwError({ id: 'app.validation_error', data: { break: true, errors: validationErrors } });
    }
  }

  /*

  onDelete

  */
  for (let fieldName of Object.keys(schema)) {
    const onDelete = schema[fieldName].onDelete;
    if (onDelete) {
      await onDelete(properties); // eslint-disable-line no-await-in-loop
    }
  }

  /*

  Before

  */
  await hooks.deleteBefore.runCallbacks({
    iterator: document,
    properties: [properties],
  });

  /*

  DB Operation

  */
  await collection.rawRemove(convertDocumentIdToIdInSelector(selector));

  // TODO: add support for caching by other indexes to Dataloader
  // clear cache if needed
  if (selector.documentId && context) {
    context.loaders[collectionName].clear(selector.documentId);
  }

  /*

  Async

  */
  await hooks.deleteAsync.runCallbacksAsync([properties]);

  await runCountOfReferenceCallbacks({
    collectionName,
    callbackStage: "deleteAsync",
    deleteAsyncProperties: properties,
  });

  return { data: document };
};
