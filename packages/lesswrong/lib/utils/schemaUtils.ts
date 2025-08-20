import { restrictViewableFieldsSingle, restrictViewableFieldsMultiple } from '../vulcan-users/restrictViewableFields';
import { loadByIds, getWithLoader } from "../loaders";
import { isServer } from '../executionEnvironment';
import { asyncFilter } from './asyncUtils';
import DataLoader from 'dataloader';
import { DeferredForumSelect } from '../forumTypeUtils';
import { getCollectionAccessFilter } from '@/server/permissions/accessFilters';

export const generateIdResolverSingle = <ForeignCollectionName extends CollectionNameString>({
  foreignCollectionName, fieldName, nullable = true
}: {
  foreignCollectionName: ForeignCollectionName,
  fieldName: string,
  nullable?: boolean,
}) => {
  type DataType = ObjectsByCollectionName[ForeignCollectionName];
  async function idResolverSingle(doc: AnyBecauseHard, args: void, context: ResolverContext): Promise<Partial<DataType>|null> {
    if (!doc[fieldName]) return null

    const { currentUser } = context

    const loader = context.loaders[foreignCollectionName] as DataLoader<string,DataType>;
    const resolvedDoc: DataType|null = await loader.load(doc[fieldName] as string)
    if (!resolvedDoc) {
      if (!nullable) {
        // eslint-disable-next-line no-console
        console.error(`Broken foreign key reference: ${foreignCollectionName}.${fieldName}=${doc[fieldName]}`);
      }
      return null;
    }

    return await accessFilterSingle(currentUser, foreignCollectionName, resolvedDoc, context);
  }

  idResolverSingle.foreignCollectionName = foreignCollectionName;
  
  return idResolverSingle;
}

export const generateIdResolverMulti = <ForeignCollectionName extends CollectionNameString>({
  foreignCollectionName, fieldName,
  getKey = ((a: any)=>a)
}: {
  foreignCollectionName: ForeignCollectionName,
  fieldName: string,
  getKey?: (key: any) => string,
}) => {
  type DbType = ObjectsByCollectionName[ForeignCollectionName];
  
  async function idResolverMulti(doc: AnyBecauseHard, args: void, context: ResolverContext): Promise<Partial<DbType>[]> {
    if (!doc[fieldName]) return []

    const keys = doc[fieldName].map(getKey)

    const { currentUser } = context

    const resolvedDocs: Array<DbType|null> = await loadByIds(context, foreignCollectionName, keys)
    return await accessFilterMultiple(currentUser, foreignCollectionName, resolvedDocs, context);
  }

  idResolverMulti.foreignCollectionName = foreignCollectionName;

  return idResolverMulti;
}

export const ACCESS_FILTERED = Symbol('ACCESS_FILTERED');

// Apply both document-level and field-level permission checks to a single document.
// If the user can't access the document, returns null. If the user can access the
// document, return a copy of the document in which any fields the user can't access
// have been removed. If document is null, returns null.
export const accessFilterSingle = async <N extends CollectionNameString, DocType extends ObjectsByCollectionName[N]>(
  currentUser: DbUser|null,
  collectionName: N,
  document: DocType|null,
  context: ResolverContext,
): Promise<(Partial<DocType> & { [ACCESS_FILTERED]: true }) | null> => {
  if (!document) return null;
  const checkAccess = getCollectionAccessFilter(collectionName);
  if (checkAccess && !(await checkAccess(currentUser, document as AnyBecauseHard, context))) return null
  const collection = context[collectionName];
  const restrictedDoc = await restrictViewableFieldsSingle(currentUser, collection, document)
  return restrictedDoc as Partial<DocType> & { [ACCESS_FILTERED]: true };
}

// Apply both document-level and field-level permission checks to a list of documents.
// Returns a list where documents which the user can't access are removed from the
// list, and fields which the user can't access are removed from the documents inside
// the list. If currentUser is null, applies permission checks for the logged-out
// view.
export const accessFilterMultiple = async <N extends CollectionNameString, DocType extends ObjectsByCollectionName[N]>(
  currentUser: DbUser|null,
  collectionName: N,
  unfilteredDocs: Array<DocType|null>,
  context: ResolverContext,
): Promise<Partial<DocType>[]> => {
  if (!unfilteredDocs) return [];
  const checkAccess = getCollectionAccessFilter(collectionName);
  
  // Filter out nulls (docs that were referenced but didn't exist)
  // Explicit cast because the type-system doesn't detect that this is removing
  // nulls.
  const existingDocs = unfilteredDocs.filter(d=>!!d);
  // Apply the collection's checkAccess function, if it has one, to filter out documents
  const filteredDocs = checkAccess
    ? await asyncFilter(existingDocs, async (d) => await checkAccess(currentUser, d as AnyBecauseHard, context))
    : existingDocs

  const collection = context[collectionName];
  // Apply field-level permissions
  const restrictedDocs = await restrictViewableFieldsMultiple(currentUser, collection, filteredDocs)
  
  return restrictedDocs;
}

export function getForeignKeySqlResolver({ collectionName, nullable, idFieldName }: {
  collectionName: CollectionNameString,
  nullable: boolean,
  idFieldName: string,
}) {
  return function foreignKeySqlResolver({field, join}: SqlResolverArgs<CollectionNameString>) {
    return join<HasIdCollectionNames>({
      table: collectionName,
      type: nullable ? "left" : "inner",
      on: {
        _id: field(idFieldName as FieldName<CollectionNameString>),
      },
      resolver: (foreignField) => foreignField("*"),
    });
  }
}

export function arrayOfForeignKeysOnCreate({newDocument, fieldName}: {
  newDocument: Record<string, any>,
  fieldName: string,
}) {
  if (newDocument[fieldName] === undefined) {
    return [];
  }
}

export const simplSchemaToGraphQLtype = (type: any): string|null => {
  if (type === String) return "String";
  else if (type === Number) return "Int";
  else if (type === Date) return "Date";
  else if (type === Boolean) return "Boolean";
  else return null;
}

export function getDenormalizedFieldOnCreate<N extends CollectionNameString>({ needsUpdate, getValue }: {
  needsUpdate?: (doc: Partial<ObjectsByCollectionName[N]> | CreateInputsByCollectionName[N]['data']) => boolean,
  getValue: (doc: ObjectsByCollectionName[N] | CreateInputsByCollectionName[N]['data'], context: ResolverContext) => any,
}): Exclude<GraphQLWriteableFieldSpecification<N>['onCreate'], undefined> {
  return async function denormalizedFieldOnCreate({newDocument, context}) {
    if (!needsUpdate || needsUpdate(newDocument)) {
      return await getValue(newDocument, context)
    }
  }
}

export function getDenormalizedFieldOnUpdate<N extends CollectionNameString>({ needsUpdate, getValue }: {
  needsUpdate?: (doc: UpdateInputsByCollectionName[N]['data']) => boolean,
  getValue: (doc: ObjectsByCollectionName[N], context: ResolverContext) => any,
}): Exclude<GraphQLWriteableFieldSpecification<N>['onUpdate'], undefined> {
  return async function denormalizedFieldOnUpdate({data, newDocument, context}: {
    data: UpdateInputsByCollectionName[N]['data'],
    newDocument: ObjectsByCollectionName[N] // & UpdateInputsByCollectionName[N]['data'],
    context: ResolverContext,
  }) {
    if (!needsUpdate || needsUpdate(data)) {
      return await getValue(newDocument, context)
    }
  }
}

export function getDenormalizedCountOfReferencesGetValue<
  SourceCollectionName extends CollectionNameString,
  TargetCollectionName extends CollectionNameString
>({
  collectionName,
  fieldName,
  foreignCollectionName,
  foreignFieldName,
  filterFn,
}: {
  collectionName: SourceCollectionName,
  fieldName: string,
  foreignCollectionName: TargetCollectionName,
  foreignFieldName: string & keyof ObjectsByCollectionName[TargetCollectionName],
  filterFn: (doc: ObjectsByCollectionName[TargetCollectionName]) => boolean,
}) {
  return async function denormalizedCountOfReferencesGetValue(doc: ObjectsByCollectionName[SourceCollectionName], context: ResolverContext) {
    if (!isServer) {
      throw new Error(`${collectionName}.${fieldName} getValue called on the client!`);
    }
    const foreignCollection = context[foreignCollectionName] as unknown as PgCollection<TargetCollectionName>;
    const docsThatMayCount = await getWithLoader<TargetCollectionName>(
      context,
      foreignCollection,
      `denormalizedCount_${collectionName}.${fieldName}`,
      {},
      foreignFieldName,
      doc._id
    );
    
    const docsThatCount = docsThatMayCount.filter(d=>filterFn(d));
    return docsThatCount.length;
  }
}

export function googleLocationToMongoLocation(gmaps: AnyBecauseTodo) {
  return {
    type: "Point",
    coordinates: [gmaps.geometry.location.lng, gmaps.geometry.location.lat]
  }
}

export function getFillIfMissing(defaultValue: any) {
  return function fillIfMissing<N extends CollectionNameString>({ newDocument, fieldName }: {
    newDocument: CreateInputsByCollectionName[N]['data'];
    fieldName: string;
  }) {
    if (newDocument[fieldName as keyof CreateInputsByCollectionName[N]['data']] === undefined) {
      const isForumSpecific = defaultValue instanceof DeferredForumSelect;
      return isForumSpecific ? defaultValue.get() : defaultValue;
    } else {
      return undefined;
    }
  };
}

export function throwIfSetToNull<N extends CollectionNameString>({ oldDocument, newDocument, fieldName }: {
  oldDocument: ObjectsByCollectionName[N];
  newDocument: ObjectsByCollectionName[N];
  fieldName: string;
}) {
  const typedName = fieldName as keyof ObjectsByCollectionName[N];
  const wasValid = oldDocument[typedName] !== undefined && oldDocument[typedName] !== null;
  const isValid = newDocument[typedName] !== undefined && newDocument[typedName] !== null;
  if (wasValid && !isValid) {
    throw new Error(`Error updating: ${fieldName} cannot be null or missing`);
  }
};

export function isUniversalField(fieldName: string): boolean {
  return fieldName==="_id" || fieldName==="schemaVersion";
}

/**
 * Based on SimpleSchema.RegEx.Url, modified to also accept the empty string
 */
export const optionalUrlRegex = new RegExp('^((?:(?:https?|ftp):\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?!10(?:\\.\\d{1,3}){3})(?!127(?:\\.\\d{1,3}){3})(?!169\\.254(?:\\.\\d{1,3}){2})(?!192\\.168(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))(?::\\d{2,5})?(?:\\/[^\\s]*)?)?$', 'i');

