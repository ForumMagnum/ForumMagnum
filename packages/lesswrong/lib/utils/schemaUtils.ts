import { restrictViewableFieldsSingle, restrictViewableFieldsMultiple } from '../vulcan-users/permissions';
import SimpleSchema from 'simpl-schema';
import { loadByIds, getWithLoader } from "../loaders";
import { isAnyTest, isServer } from '../executionEnvironment';
import { asyncFilter } from './asyncUtils';
import type { GraphQLScalarType } from 'graphql';
import DataLoader from 'dataloader';
import * as _ from 'underscore';
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
  const restrictedDoc = restrictViewableFieldsSingle(currentUser, collectionName, document)
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
  const checkAccess = getCollectionAccessFilter(collectionName);
  
  // Filter out nulls (docs that were referenced but didn't exist)
  // Explicit cast because the type-system doesn't detect that this is removing
  // nulls.
  const existingDocs = _.filter(unfilteredDocs, d=>!!d) as DocType[];
  // Apply the collection's checkAccess function, if it has one, to filter out documents
  const filteredDocs = checkAccess
    ? await asyncFilter(existingDocs, async (d) => await checkAccess(currentUser, d as AnyBecauseHard, context))
    : existingDocs
  // Apply field-level permissions
  const restrictedDocs = restrictViewableFieldsMultiple(currentUser, collectionName, filteredDocs)
  
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

/**
 * This field is stored in the database as a string, but resolved as the
 * referenced document
 */
export const foreignKeyField = <const CollectionName extends CollectionNameString>({
  idFieldName,
  resolverName,
  collectionName,
  type,
  nullable=true,
  autoJoin=false,
}: {
  idFieldName: string,
  resolverName: string,
  collectionName: CollectionName,
  type: string,
  /** whether the resolver field is nullable, not the original database field */
  nullable?: boolean,
  /**
   * If set, auto-generated SQL queries will contain a join to fetch the object
   * this refers to. This saves a query and a DB round trip, but means that if
   * two objects contain the same foreign-key ID and fetch the same object, the
   * SQL result set will contain two copies. This is typically a good trade on
   * relations where every one is going to be unique, such as currentUserVote.
   */
  autoJoin?: boolean,
}) => {
  if (!idFieldName || !resolverName || !collectionName || !type)
    throw new Error("Missing argument to foreignKeyField");
  
  return {
    type: String,
    foreignKey: collectionName,
    resolveAs: {
      fieldName: resolverName,
      type: nullable ? type : `${type}!`,
      resolver: generateIdResolverSingle({
        foreignCollectionName: collectionName,
        fieldName: idFieldName,
        nullable,
      }),
      // Currently `sqlResolver`s are only used by the default resolvers which
      // handle permissions checks automatically. If we ever expand this system
      // to make SQL resolvers useable by arbitrary resolvers then we (probably)
      // need to add some permission checks here somehow.
      ...(autoJoin ? {
        sqlResolver: getForeignKeySqlResolver({ collectionName, nullable, idFieldName }),
      } : {}),
      addOriginalField: true,
    },
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

export function arrayOfForeignKeysField<CollectionName extends keyof CollectionsByName>({idFieldName, resolverName, collectionName, type, getKey}: {
  idFieldName: string,
  resolverName: string,
  collectionName: CollectionName,
  type: string,
  getKey?: (key: any) => string,
}) {
  if (!idFieldName || !resolverName || !collectionName || !type)
    throw new Error("Missing argument to foreignKeyField");
  
  return {
    type: Array,

    defaultValue: [],
    onCreate: arrayOfForeignKeysOnCreate,
    canAutofillDefault: true,
    nullable: false,
    resolveAs: {
      fieldName: resolverName,
      type: `[${type}!]!`,
      resolver: generateIdResolverMulti({
        foreignCollectionName: collectionName,
        fieldName: idFieldName,
        getKey
      }),
      addOriginalField: true
    },
  }
}

export const simplSchemaToGraphQLtype = (type: any): string|null => {
  if (type === String) return "String";
  else if (type === Number) return "Int";
  else if (type === Date) return "Date";
  else if (type === Boolean) return "Boolean";
  else return null;
}

interface ResolverOnlyFieldArgs<N extends CollectionNameString> extends CollectionFieldSpecification<N> {
  resolver: (doc: ObjectsByCollectionName[N], args: any, context: ResolverContext) => any,
  sqlResolver?: SqlResolver<N>,
  sqlPostProcess?: SqlPostProcess<N>,
  graphQLtype?: string|GraphQLScalarType|null,
  graphqlArguments?: string|null,
}

/**
 * This field is not stored in the database, but is filled in at query-time by
 * our GraphQL API using the supplied resolver function.
 */
export const resolverOnlyField = <N extends CollectionNameString>({
  type,
  graphQLtype=null,
  resolver,
  sqlResolver,
  sqlPostProcess,
  graphqlArguments=null,
  ...rest
}: ResolverOnlyFieldArgs<N>): CollectionFieldSpecification<N> => {
  const resolverType = graphQLtype || simplSchemaToGraphQLtype(type);
  if (!type || !resolverType)
    throw new Error("Could not determine resolver graphQL type:" + type + ' ' + graphQLtype);
  return {
    type: type,
    optional: true,
    resolveAs: {
      type: resolverType,
      arguments: graphqlArguments,
      resolver,
      sqlResolver,
      sqlPostProcess,
    },
    ...rest
  }
}

// For auto-generated database type definitions, provides a (string) definition
// of this field's type. Useful for fields that would otherwise be black-box types.
SimpleSchema.extendOptions(['typescriptType'])

// For denormalized fields, needsUpdate is an optional attribute that
// determines whether the denormalization function should be rerun given
// the new document after an update or an insert
SimpleSchema.extendOptions(['needsUpdate'])

// For denormalized fields, getValue returns the new denormalized value of
// the field, given the new document after an update or an insert
SimpleSchema.extendOptions(['getValue'])

// For denormalized fields, marks a field so that we can automatically
// get the automatically recompute the new denormalized value via
// `Vulcan.recomputeDenormalizedValues` in the Meteor shell
SimpleSchema.extendOptions(['canAutoDenormalize'])

// Whether to log changes to this field to the LWEvents collection. If undefined
// (neither true nor false), will be logged if the logChanges option is set on
// the collection and the denormalized option is false.
SimpleSchema.extendOptions(['logChanges'])

// For fields that are automatically updated counts of references (see
// addCountOfReferenceCallbacks).
SimpleSchema.extendOptions(['countOfReferences']);

// For fields that are editable, this option allows you to specify the editable field options
SimpleSchema.extendOptions(['editableFieldOptions']);

// For slug fields, this option allows you to specify the options necessary to run the slug callbacks
SimpleSchema.extendOptions(['slugCallbackOptions']);


SimpleSchema.extendOptions([
  'hidden', // hidden: true means the field is never shown in a form no matter what
  'form', // extra form properties
  'input', // SmartForm control (String or React component)
  'control', // SmartForm control (String or React component) (legacy)
  'order', // position in the form
  'group', // form fieldset group

  'onCreate', // field insert callback
  'onUpdate', // field edit callback
  'onDelete', // field remove callback

  'canRead', // who can view the field
  'canCreate', // who can insert the field
  'canUpdate', // who can edit the field

  'resolveAs', // field-level resolver
  'description', // description/help
  'beforeComponent', // before form component
  'afterComponent', // after form component
  'placeholder', // form field placeholder value
  'options', // form options
  'query', // field-specific data loading query
  'unique', // field can be used as part of a selectorUnique when querying for data

  'tooltip', // if not empty, the field will provide a tooltip when hovered over

  // canAutofillDefault: Marks a field where, if its value is null, it should
  // be auto-replaced with defaultValue in migration scripts.
  'canAutofillDefault',

  // denormalized: In a schema entry, denormalized:true means that this field can
  // (in principle) be regenerated from other fields. For now, it's a glorified
  // machine-readable comment; in the future, it may have other infrastructure
  // attached.
  'denormalized',

  // foreignKey: In a schema entry, this is either an object {collection,field},
  // or just a string, in which case the string is the collection name and field
  // is _id. Indicates that if this field is present and not null, its value
  // must correspond to an existing row in the named collection. For example,
  //
  //   foreignKey: 'Users'
  //   means that the value of this field must be the _id of a user;
  //
  //   foreignKey: {
  //     collection: 'Posts',
  //     field: 'slug'
  //   }
  //   means that the value of this field must be the slug of a post.
  //
   'foreignKey',

  // nullable: In a schema entry, this boolean indicates whether the type system
  // should treat this field as nullable 
   'nullable',

  // Define a static vector size for use in Postgres - this should only be
  // used on array fields
   'vectorSize'
]);

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

// Helper function to add all the correct callbacks and metadata for a field
// which is denormalized, where its denormalized value is a function only of
// the other fields on the document. (Doesn't work if it depends on the contents
// of other collections, because it doesn't set up callbacks for changes in
// those collections)
export function denormalizedField<N extends CollectionNameString>({ needsUpdate, getValue }: {
  needsUpdate?: (doc: Partial<ObjectsByCollectionName[N]> | CreateInputsByCollectionName[N]['data'] | UpdateInputsByCollectionName[N]['data']) => boolean,
  getValue: (doc: ObjectsByCollectionName[N] | CreateInputsByCollectionName[N]['data'] | UpdateInputsByCollectionName[N]['data'], context: ResolverContext) => any,
}): CollectionFieldSpecification<N> {
  return {
    onUpdate: getDenormalizedFieldOnUpdate({ needsUpdate, getValue }) as CollectionFieldSpecification<N>['onUpdate'],
    onCreate: getDenormalizedFieldOnCreate({ needsUpdate, getValue }) as CollectionFieldSpecification<N>['onCreate'],
    denormalized: true,
    canAutoDenormalize: true,
    optional: true,
    needsUpdate,
    getValue
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
    const foreignCollection = context[foreignCollectionName] as CollectionBase<TargetCollectionName>;
    const docsThatMayCount = await getWithLoader<TargetCollectionName>(
      context,
      foreignCollection,
      `denormalizedCount_${collectionName}.${fieldName}`,
      {},
      foreignFieldName,
      doc._id
    );
    
    const docsThatCount = _.filter(docsThatMayCount, d=>filterFn(d));
    return docsThatCount.length;
  }
}

// Create a denormalized field which counts the number of objects in some other
// collection whose value for a field is this object's ID. For example, count
// the number of comments on a post, or the number of posts by a user, updating
// when objects are created/deleted/updated.
export function denormalizedCountOfReferences<
  SourceCollectionName extends CollectionNameString,
  TargetCollectionName extends CollectionNameString
>({
  collectionName,
  fieldName,
  foreignCollectionName,
  foreignTypeName,
  foreignFieldName,
  filterFn,
  resyncElastic,
}: {
  collectionName: SourceCollectionName,
  fieldName: string & keyof ObjectsByCollectionName[SourceCollectionName],
  foreignCollectionName: TargetCollectionName,
  foreignTypeName: string,
  foreignFieldName: string & keyof ObjectsByCollectionName[TargetCollectionName],
  filterFn?: (doc: ObjectsByCollectionName[TargetCollectionName]) => boolean,
  resyncElastic?: boolean,
}): CollectionFieldSpecification<SourceCollectionName> {
  const filter = filterFn || ((doc: ObjectsByCollectionName[TargetCollectionName]) => true);
  
  return {
    type: Number,
    optional: true,
    nullable: false,
    defaultValue: 0,
    onCreate: ()=>0,
    canAutofillDefault: true,
    
    denormalized: true,
    canAutoDenormalize: true,
    
    getValue: getDenormalizedCountOfReferencesGetValue({
      collectionName,
      fieldName,
      foreignCollectionName,
      foreignFieldName,
      filterFn: filter,
    }),
    
    countOfReferences: {
      foreignCollectionName,
      foreignFieldName,
      filterFn: filter,
      resyncElastic: (resyncElastic && !isAnyTest) ?? false,
    },
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
    newDocument: CreateInputsByCollectionName[N]['data']; // Partial<DbInsertion<ObjectsByCollectionName[N]>>;
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

export function schemaDefaultValue<N extends CollectionNameString>(
  defaultValue: any,
): Partial<CollectionFieldSpecification<N>> {
  const isForumSpecific = defaultValue instanceof DeferredForumSelect;

  const fillIfMissing = getFillIfMissing(defaultValue);

  return {
    defaultValue: isForumSpecific ? defaultValue.getDefault() : defaultValue,
    onCreate: fillIfMissing as CollectionFieldSpecification<N>['onCreate'],
    onUpdate: throwIfSetToNull,
    canAutofillDefault: true,
    nullable: false
  };
}

export function slugFields<N extends CollectionNameWithSlug>(collectionName: N, {
  collectionsToAvoidCollisionsWith,
  getTitle,
  onCollision="newDocumentGetsSuffix",
  includesOldSlugs,
  slugOptions,
  oldSlugsOptions,
}: {
  /**
   * If set, check for collisions not just within the same collision, but also
   * within a provided list of other collections.
   */
  collectionsToAvoidCollisionsWith?: CollectionNameWithSlug[],

  /**
   * Returns the title that will be used to generate slugs. (This does not have
   * to already be slugified.)
   */
  getTitle: (obj: ObjectsByCollectionName[N]) => string,
  
  /**
   * How to handle it when a newly created document's slug, or the new slug in
   * a document whose slug is being edited, collides with the slug on an
   * existing document.
   *   newDocumentGetsSuffix: Add a suffix to the slug of the new document
   *   rejectNewDocument: Block the creation/edit of the new document that
   *     had a colliding slug
   *   rejectIfExplicit: If the colliding slug was inferred from a change to
   *     the title, deconflict it with a suffix. If the slug was edited
   *     directly, however, reject the edit.
   */
  onCollision?: "newDocumentGetsSuffix"|"rejectNewDocument"|"rejectIfExplicit",

  /**
   * If true, adds a field `oldSlugs` and automatically adds to it when slugs
   * change.
   */
  includesOldSlugs: boolean,

  /**
   * Additional options, such as editing permissions or form group, to add to
   * the slug field.
   */
  slugOptions?: Partial<CollectionFieldSpecification<N>>,

  /**
   * Additional options, such as editing permissions or form group, to add to
   * the oldSlugs field.
   */
  oldSlugsOptions?: Partial<CollectionFieldSpecification<N>>,
}) {

  // If no collectionsToAvoidCollisionsWith are provided, just check for collisions within the same collection.
  collectionsToAvoidCollisionsWith ??= [collectionName];

  const slugCallbackOptions: SlugCallbackOptions<N> = {
    collectionsToAvoidCollisionsWith,
    getTitle,
    onCollision,
    includesOldSlugs
  };

  const slugFields: Record<string, CollectionFieldSpecification<N>> = {
    slug: {
      type: String,
      optional: true,
      nullable: false,
      canRead: ['guests'],
      ...slugOptions,
      slugCallbackOptions,
    },
    ...(includesOldSlugs ? {
      oldSlugs: {
        type: Array,
        optional: true,
        canRead: ['guests'],
        ...schemaDefaultValue([]),
        ...oldSlugsOptions,
      },
      'oldSlugs.$': {
        type: String,
        optional: true,
        canRead: ['guests'],
      },
    } : {}),
  };

  return slugFields;
}
