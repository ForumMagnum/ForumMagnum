import { convertDocumentIdToIdInSelector, UpdateSelector } from '../../lib/vulcan-lib/utils';
import { validateDocument, validateData, dataToModifier } from './validation';
import { throwError } from './errors';
import type { CreateCallbackProperties, UpdateCallbackProperties, AfterCreateCallbackProperties } from '../mutationCallbacks';
import isEmpty from 'lodash/isEmpty';
import pickBy from 'lodash/pickBy';
import clone from 'lodash/clone';

/**
 * @deprecated Prefer to avoid using onCreate callbacks on fields for new collections.
 */
export async function runFieldOnCreateCallbacks<
  S extends NewSchemaType<CollectionName>,
  CollectionName extends CollectionNameString,
  D extends {} = CreateInputsByCollectionName[CollectionName]['data']
>(schema: S, data: D, properties: CreateCallbackProperties<CollectionName, D>): Promise<D> {
  for (let fieldName in schema) {
    let autoValue;
    const { graphql } = schema[fieldName];
    if (graphql && 'onCreate' in graphql && !!graphql.onCreate) {
      autoValue = await graphql.onCreate({ ...properties, fieldName });
    }
    if (typeof autoValue !== 'undefined') {
      Object.assign(data, { [fieldName]: autoValue });
    }
  }

  return data;
}

/**
 * @deprecated Prefer to avoid using onUpdate callbacks on fields for new collections.
 */
export async function runFieldOnUpdateCallbacks<
  S extends NewSchemaType<CollectionName>,
  CollectionName extends CollectionNameString,
  D extends {} = UpdateInputsByCollectionName[CollectionName]['data']
>(
  schema: S,
  data: D,
  properties: UpdateCallbackProperties<CollectionName, D>
): Promise<D> {
  const dataAsModifier = dataToModifier(clone(data));
  for (let fieldName in schema) {
    let autoValue;
    const { graphql } = schema[fieldName];
    if (graphql && 'onUpdate' in graphql && !!graphql.onUpdate) {
      autoValue = await graphql.onUpdate({ ...properties, fieldName, modifier: dataAsModifier });
    }
    if (typeof autoValue !== 'undefined') {
      Object.assign(data, { [fieldName]: autoValue });
    }
  }

  return data;
}

interface CheckCreatePermissionsAndReturnArgumentsProps<N extends CollectionNameString, S extends NewSchemaType<N>, D = CreateInputsByCollectionName[N]['data']> {
  context: ResolverContext;
  data: D;
  schema: S,
}

interface CheckUpdatePermissionsAndReturnArgumentsProps<N extends CollectionNameString, S extends NewSchemaType<N>, D = UpdateInputsByCollectionName[N]['data']> {
  selector: SelectorInput;
  context: ResolverContext;
  data: D;
  schema: S,
}

/**
 * @deprecated This function returns createCallbackProperties, which
 * is a legacy holdover from mutation callbacks.  If you're creating
 * a new collection with default mutations, just pass in whatever
 * arguments you need to functions you have before/after the db update.
 */
export async function getLegacyCreateCallbackProps<const T extends CollectionNameString, S extends NewSchemaType<T>, D extends {} = CreateInputsByCollectionName[T]['data']>(
  collectionName: T,
  { context, data, schema }: CheckCreatePermissionsAndReturnArgumentsProps<T, S, D>
) {
  const { currentUser } = context;
  const collection = context[collectionName] as CollectionBase<T>;

  const callbackProps: CreateCallbackProperties<T, D> = {
    collection,
    document: data,
    newDocument: data,
    currentUser,
    context,
    schema,
  };

  return callbackProps;
}

export function getPreviewDocument<N extends CollectionNameString, D extends {} = UpdateInputsByCollectionName[N]['data']>(data: D, oldDocument: ObjectsByCollectionName[N]): ObjectsByCollectionName[N] {
  return pickBy({
    ...oldDocument,
    ...data,
  }, (value) => value !== null) as ObjectsByCollectionName[N];
}

/**
 * @deprecated This function returns updateCallbackProperties, which
 * is a legacy holdover from mutation callbacks.  If you're creating
 * a new collection with default mutations, just pass in whatever
 * arguments you need to functions you have before/after the db update.
 */
export async function getLegacyUpdateCallbackProps<const T extends CollectionNameString, S extends NewSchemaType<T>, D extends {} = UpdateInputsByCollectionName[T]['data']>(
  collectionName: T,
  { selector, context, data, schema }: CheckUpdatePermissionsAndReturnArgumentsProps<T, S, D>
) {
  const { currentUser, loaders } = context;
  const collection = context[collectionName] as CollectionBase<T>;

  if (isEmpty(selector)) {
    throw new Error('Selector cannot be empty');
  }

  // get entire unmodified document from database
  const documentSelector = convertDocumentIdToIdInSelector(selector as UpdateSelector);
  const oldDocument = await loaders[collectionName].load(documentSelector._id);

  if (!oldDocument) {
    throwError({ id: 'app.document_not_found', data: { documentId: documentSelector._id } });
  }

  const previewDocument = getPreviewDocument(data, oldDocument);

  const updateCallbackProperties: UpdateCallbackProperties<T> = {
    data,
    oldDocument,
    newDocument: previewDocument,
    currentUser,
    collection,
    context,
    schema
  };

  return {
    documentSelector,
    previewDocument,
    updateCallbackProperties,
  };
}

export function assignUserIdToData(data: unknown, currentUser: DbUser | null, schema: NewSchemaType<CollectionNameString>) {
  // You know, it occurs to me that this seems to allow users to insert arbitrary userIds
  // for documents they're creating if they have a userId field and canCreate: member.
  if (currentUser && schema.userId && !(data as HasUserIdType).userId) {
    (data as unknown as HasUserIdType).userId = currentUser._id;
  }
}

export async function insertAndReturnCreateAfterProps<N extends CollectionNameString, T extends CreateInputsByCollectionName[N]['data'] | Partial<ObjectsByCollectionName[N]>>(data: T, collectionName: N, createCallbackProperties: CreateCallbackProperties<N, T>) {
  const collection = createCallbackProperties.context[collectionName] as CollectionBase<N>;
  const insertedId = await collection.rawInsert(data);
  const insertedDocument = (await collection.findOne(insertedId))!;

  const afterCreateProperties: AfterCreateCallbackProperties<N> = {
    ...createCallbackProperties,
    document: insertedDocument,
    newDocument: insertedDocument
  };

  return afterCreateProperties;
}

export async function updateAndReturnDocument<N extends CollectionNameString>(
  data: UpdateInputsByCollectionName[N]['data'] | Partial<ObjectsByCollectionName[N]>,
  collection: CollectionBase<N>,
  selector: { _id: string },
  context: ResolverContext
): Promise<ObjectsByCollectionName[N]> {
  const modifier = dataToModifier(data);

  // remove empty modifiers
  if (isEmpty(modifier.$set)) {
    delete modifier.$set;
  }
  if (isEmpty(modifier.$unset)) {
    delete modifier.$unset;
  }

  // if there's nothing to update, return the original document
  if (isEmpty(modifier)) {
    return (await collection.findOne(selector))!;
  }

  // update document
  await collection.rawUpdateOne(selector, modifier);

  // get fresh copy of document from db
  const updatedDocument = await collection.findOne(selector);
  if (!updatedDocument) {
    throw new Error("Could not find updated document after applying update");
  }

  // This used to be documentId, but I think the fact that it was documentId
  // and not _id was just a bug???
  if (selector._id && context) {
    context.loaders[collection.collectionName].clear(selector._id);
  }

  return updatedDocument;
}
