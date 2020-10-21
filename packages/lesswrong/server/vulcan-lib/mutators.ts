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
Being async, they won't hold up the mutation and slow down its response time
to the client.

*/

import { runCallbacks, runCallbacksAsync, Utils } from '../../lib/vulcan-lib/index';
import {
  validateDocument,
  validateData,
  dataToModifier,
  modifierToData,
} from '../../lib/vulcan-lib/validation';
import { throwError } from './errors';
import { Connectors } from './connectors';
import clone from 'lodash/clone';
import isEmpty from 'lodash/isEmpty';
import { createError } from 'apollo-errors';
import pickBy from 'lodash/pickBy';

//
// Create mutation
// Inserts an entry in a collection, and runs a bunch of callback functions to
// fill in its denormalized fields etc. Input is a Partial<T>, because some
// fields will be filled in by those callbacks; result is a T, but nothing
// in the type system ensures that everything actually gets filled in.
//
export const createMutator = async <T extends DbObject>({
  collection,
  document,
  data,
  currentUser,
  validate=true,
  context,
}: {
  collection: CollectionBase<T>,
  document: Partial<T>,
  data?: Partial<T>,
  currentUser?: DbUser|null,
  validate?: boolean,
  context?: any,
}): Promise<{
  data: T
}> => {
  // OpenCRUD backwards compatibility: accept either data or document
  // we don't want to modify the original document
  document = data || document;

  const { collectionName, typeName } = collection.options;
  const schema = collection.simpleSchema()._schema;

  /*

  Properties

  Note: keep newDocument for backwards compatibility

  */
  const properties = { data, currentUser, collection, context, document, newDocument: document, schema };

  /*

  Validation

  */
  if (validate) {
    let validationErrors: Array<any> = [];
    validationErrors = validationErrors.concat(validateDocument(document, collection, context));
    // run validation callbacks
    validationErrors = await runCallbacks({
      name: `${typeName.toLowerCase()}.create.validate`,
      iterator: validationErrors,
      properties,
      ignoreExceptions: false,
    });
    validationErrors = await runCallbacks({
      name: '*.create.validate',
      iterator: validationErrors,
      properties,
      ignoreExceptions: false,
    });
    // OpenCRUD backwards compatibility
    document = await runCallbacks({
      name: `${collectionName.toLowerCase()}.new.validate`,
      iterator: document,
      properties: [currentUser, validationErrors],
      ignoreExceptions: false,
    });
    if (validationErrors.length) {
      console.log(validationErrors); // eslint-disable-line no-console
      throwError({ id: 'app.validation_error', data: { break: true, errors: validationErrors } });
    }
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
  for (let fieldName of Object.keys(schema)) {
    let autoValue;
    if (schema[fieldName].onCreate) {
      // OpenCRUD backwards compatibility: keep both newDocument and data for now, but phase out newDocument eventually
      // eslint-disable-next-line no-await-in-loop
      autoValue = await schema[fieldName].onCreate({...properties, fieldName}); // eslint-disable-line no-await-in-loop
    } else if (schema[fieldName].onInsert) {
      // OpenCRUD backwards compatibility
      autoValue = await schema[fieldName].onInsert(clone(document), currentUser); // eslint-disable-line no-await-in-loop
    }
    if (typeof autoValue !== 'undefined') {
      document[fieldName] = autoValue;
    }
  }

  // TODO: find that info in GraphQL mutations
  // if (Meteor.isServer && this.connection) {
  //   post.userIP = this.connection.clientAddress;
  //   post.userAgent = this.connection.httpHeaders['user-agent'];
  // }

  /*

  Before

  */
  document = await runCallbacks({
    name: `${typeName.toLowerCase()}.create.before`,
    iterator: document,
    properties,
  });
  document = await runCallbacks({ name: '*.create.before', iterator: document, properties });
  // OpenCRUD backwards compatibility
  document = await runCallbacks({
    name: `${collectionName.toLowerCase()}.new.before`,
    iterator: document,
    properties: [
      currentUser
    ]
  });
  document = await runCallbacks({
    name: `${collectionName.toLowerCase()}.new.sync`,
    iterator: document,
    properties: [currentUser]
  });

  /*

  DB Operation

  */
  document._id = await Connectors.create(collection, document as T);

  /*

  After

  */
  // run any post-operation sync callbacks
  document = await runCallbacks({
    name: `${typeName.toLowerCase()}.create.after`,
    iterator: document,
    properties,
  });
  document = await runCallbacks({ name: '*.create.after', iterator: document, properties });
  // OpenCRUD backwards compatibility
  document = await runCallbacks({
    name: `${collectionName.toLowerCase()}.new.after`,
    iterator: document,
    properties: [currentUser]
  });

  // note: query for document to get fresh document with collection-hooks effects applied
  const queryResult = await Connectors.get(collection, document._id);
  if (queryResult)
    document = queryResult;

  /*

  Async

  */
  // note: make sure properties.document is up to date
  await runCallbacksAsync({
    name: `${typeName.toLowerCase()}.create.async`,
    properties: [{ ...properties, document: document }],
  });
  await runCallbacksAsync({ name: '*.create.async', properties: [properties] });
  // OpenCRUD backwards compatibility
  await runCallbacksAsync({
    name: `${collectionName.toLowerCase()}.new.async`,
    iterator: document,
    properties: [
      currentUser,
      collection
    ]
  });

  return { data: document as T };
};

//
// Update mutation
// Updates a single database entry, and runs callbacks/etc to update its
// denormalized fields. The preferred way to do this is with a documentId;
// in theory you can use a selector, but you should only do this if you're sure
// there's only one matching document (eg, slug). Returns the modified document.
//
export const updateMutator = async <T extends DbObject>({
  collection,
  documentId,
  selector,
  data,
  set = {},
  unset = {},
  currentUser,
  validate=true,
  context,
  document: oldDocument,
}: {
  collection: CollectionBase<T>,
  documentId: string,
  selector?: any,
  data?: Partial<T>,
  set?: Partial<T>,
  unset?: any,
  currentUser?: DbUser|null,
  validate?: boolean,
  context?: any,
  document?: T|null,
}): Promise<{
  data: T
}> => {
  const { collectionName, typeName } = collection.options;
  const schema = collection.simpleSchema()._schema;

  // OpenCRUD backwards compatibility
  selector = selector || { _id: documentId };
  data = data || modifierToData({ $set: set, $unset: unset });

  if (isEmpty(selector)) {
    throw new Error('Selector cannot be empty');
  }

  // get original document from database or arguments
  oldDocument = oldDocument || (await Connectors.get(collection, selector));

  if (!oldDocument) {
    throw new Error(`Could not find document to update for selector: ${JSON.stringify(selector)}`);
  }

  // get a "preview" of the new document
  let document: T = { ...oldDocument, ...data };
  // FIXME: Filtering out null-valued fields here is a very sketchy, probably
  // wrong thing to do. This originates from Vulcan, and it's not clear why it's
  // doing it. Explicit cast to make it type-check anyways.
  document = pickBy(document, f => f !== null) as any;

  /*

  Properties

  */
  const properties = { data, oldDocument, document, newDocument: document, currentUser, collection, context, schema };

  /*

  Validation

  */
  if (validate) {
    let validationErrors: any = [];

    validationErrors = validationErrors.concat(validateData(data, document, collection, context));

    validationErrors = await runCallbacks({
      name: `${typeName.toLowerCase()}.update.validate`,
      iterator: validationErrors,
      properties,
      ignoreExceptions: false,
    });
    validationErrors = await runCallbacks({
      name: '*.update.validate',
      iterator: validationErrors,
      properties,
      ignoreExceptions: false,
    });
    // OpenCRUD backwards compatibility
    data = modifierToData(
      await runCallbacks({
        name: `${collectionName.toLowerCase()}.edit.validate`,
        iterator: dataToModifier(data),
        properties: [document, currentUser, validationErrors],
        ignoreExceptions: false,
      })
    );

    // LESSWRONG - added custom message (showing all validation errors instead of a generic message)
    if (validationErrors.length) {
      console.log('// validationErrors'); // eslint-disable-line no-console
      console.log(validationErrors); // eslint-disable-line no-console
      const EditDocumentValidationError = createError('app.validation_error', {message: JSON.stringify(validationErrors)});
      throw new EditDocumentValidationError({data: { break: true, errors: validationErrors }});
    }
  }

  /*

  onUpdate

  */
  for (let fieldName of Object.keys(schema)) {
    let autoValue;
    if (schema[fieldName].onUpdate) {
      // eslint-disable-next-line no-await-in-loop
      autoValue = await schema[fieldName].onUpdate(properties);
    } else if (schema[fieldName].onEdit) {
      // OpenCRUD backwards compatibility
      // eslint-disable-next-line no-await-in-loop
      autoValue = await schema[fieldName].onEdit(
        dataToModifier(clone(data)),
        oldDocument,
        currentUser,
        document
      );
    }
    if (typeof autoValue !== 'undefined') {
      data![fieldName] = autoValue;
    }
  }

  /*

  Before

  */
  data = await runCallbacks({
    name: `${typeName.toLowerCase()}.update.before`,
    iterator: data,
    properties,
  });
  data = await runCallbacks({ name: '*.update.before', iterator: data, properties });
  // OpenCRUD backwards compatibility
  data = modifierToData(
    await runCallbacks({
      name: `${collectionName.toLowerCase()}.edit.before`,
      iterator: dataToModifier(data),
      properties: [
        oldDocument,
        currentUser,
        document
      ]
    })
  );
  data = modifierToData(
    await runCallbacks({
      name: `${collectionName.toLowerCase()}.edit.sync`,
      iterator: dataToModifier(data),
      properties: [
        oldDocument,
        currentUser,
        document
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
    await Connectors.update(collection, selector, modifier, { removeEmptyStrings: false });

    // get fresh copy of document from db
    const fetched = await Connectors.get(collection, selector);
    if (!fetched)
      throw new Error("Could not find updated document after applying update");
    document = fetched;

    // TODO: add support for caching by other indexes to Dataloader
    // https://github.com/VulcanJS/Vulcan/issues/2000
    // clear cache if needed
    if (selector.documentId && collection.loader) {
      collection.loader.clear(selector.documentId);
    }
  }

  /*

  After

  */
  document = await runCallbacks({
    name: `${typeName.toLowerCase()}.update.after`,
    iterator: document,
    properties,
  });
  document = await runCallbacks({ name: '*.update.after', iterator: document, properties });
  // OpenCRUD backwards compatibility
  document = await runCallbacks({
    name: `${collectionName.toLowerCase()}.edit.after`,
    iterator: document,
    properties: [
      oldDocument,
      currentUser
    ]
  });

  /*

  Async

  */
  // run async callbacks
  await runCallbacksAsync({ name: `${typeName.toLowerCase()}.update.async`, properties: [properties] });
  await runCallbacksAsync({ name: '*.update.async', properties: [properties] });
  // OpenCRUD backwards compatibility
  await runCallbacksAsync({
    name: `${collectionName.toLowerCase()}.edit.async`,
    properties: [
      document,
      oldDocument,
      currentUser,
      collection
    ]
  });

  return { data: document };
};

//
// Delete mutation
// Deletes a single database entry, and runs any callbacks/etc that trigger on
// that. Returns the entry that was deleted.
//
export const deleteMutator = async <T extends DbObject>({
  collection,
  documentId,
  selector,
  currentUser,
  validate=true,
  context,
  document,
}: {
  collection: CollectionBase<T>,
  documentId: string,
  selector?: MongoSelector<T>,
  currentUser?: DbUser|null,
  validate?: boolean,
  context?: any,
  document?: T|null,
}): Promise<{
  data: T|null|undefined
}> => {
  const { collectionName, typeName } = collection.options;
  const schema = collection.simpleSchema()._schema;
  // OpenCRUD backwards compatibility
  selector = selector || { _id: documentId };

  if (isEmpty(selector)) {
    throw new Error('Selector cannot be empty');
  }

  document = document || (await Connectors.get(collection, selector));

  if (!document) {
    throw new Error(`Could not find document to delete for selector: ${JSON.stringify(selector)}`);
  }

  /*

  Properties

  */
  const properties = { document, currentUser, collection, context, schema };

  /*

  Validation

  */
  if (validate) {
    let validationErrors: any = [];

    validationErrors = await runCallbacks({
      name: `${typeName.toLowerCase()}.delete.validate`,
      iterator: validationErrors,
      properties,
      ignoreExceptions: false,
    });
    validationErrors = await runCallbacks({
      name: '*.delete.validate',
      iterator: validationErrors,
      properties,
      ignoreExceptions: false,
    });
    // OpenCRUD backwards compatibility
    document = await runCallbacks({
      name: `${collectionName.toLowerCase()}.remove.validate`,
      iterator: document,
      properties: [currentUser],
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
    if (schema[fieldName].onDelete) {
      await schema[fieldName].onDelete(properties); // eslint-disable-line no-await-in-loop
    } else if (schema[fieldName].onRemove) {
      // OpenCRUD backwards compatibility
      await schema[fieldName].onRemove(document, currentUser); // eslint-disable-line no-await-in-loop
    }
  }

  /*

  Before

  */
  await runCallbacks({
    name: `${typeName.toLowerCase()}.delete.before`,
    iterator: document,
    properties,
  });
  await runCallbacks({ name: '*.delete.before', iterator: document, properties });
  // OpenCRUD backwards compatibility
  await runCallbacks({
    name: `${collectionName.toLowerCase()}.remove.before`,
    iterator: document,
    properties: [currentUser]
  });
  await runCallbacks({
    name: `${collectionName.toLowerCase()}.remove.sync`,
    iterator: document,
    properties: [currentUser]
  });

  /*

  DB Operation

  */
  await Connectors.delete(collection, selector);

  // TODO: add support for caching by other indexes to Dataloader
  // clear cache if needed
  if (selector.documentId && collection.loader) {
    collection.loader.clear(selector.documentId);
  }

  /*

  Async

  */
  await runCallbacksAsync({ name: `${typeName.toLowerCase()}.delete.async`, properties: [properties] });
  await runCallbacksAsync({ name: '*.delete.async', properties: [properties] });
  // OpenCRUD backwards compatibility
  await runCallbacksAsync({
    name: `${collectionName.toLowerCase()}.remove.async`,
    properties: [
      document,
      currentUser,
      collection
    ]
  });

  return { data: document };
};

Utils.createMutator = createMutator;
Utils.updateMutator = updateMutator;
Utils.deleteMutator = deleteMutator;
