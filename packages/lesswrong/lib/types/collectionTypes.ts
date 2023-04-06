/*
 * Type definitions for mongo operations and our mongo collections
 *
 * This file could arguably be .d.ts (and it did use to be), but when it was, it
 * was getting ignored by the type checker as an external library file, as
 * --skipLibCheck just ignores all .d.ts files.
 */
import type DataLoader from 'dataloader';
import type { Request, Response } from 'express';
import type { CollectionAggregationOptions, CollationDocument } from 'mongodb';
import type PgCollection from "../sql/PgCollection";

/// This file is wrapped in 'declare global' because it's an ambient declaration
/// file (meaning types in this file can be used without being imported).
declare global {

// See mongoCollection.ts for implementation
interface CollectionBase<
  T extends DbObject,
  N extends CollectionNameString = CollectionNameString
> {
  collectionName: N
  postProcess?: (data: T) => T;
  typeName: string,
  options: CollectionOptions
  addDefaultView: (view: ViewFunction<N>) => void
  addView: (viewName: string, view: ViewFunction<N>) => void
  defaultView: ViewFunction<N> //FIXME: This is actually nullable (but should just have a default)
  views: Record<string, ViewFunction<N>>
  
  _schemaFields: SchemaType<T>
  _simpleSchema: any

  isPostgres: () => this is PgCollection<T>
  isConnected: () => boolean

  rawCollection: ()=>{bulkWrite: any, findOneAndUpdate: any, dropIndex: any, indexes: any, updateOne: any, updateMany: any}
  checkAccess: (user: DbUser|null, obj: T, context: ResolverContext|null, outReasonDenied?: {reason?: string}) => Promise<boolean>
  find: (selector?: MongoSelector<T>, options?: MongoFindOptions<T>, projection?: MongoProjection<T>) => FindResult<T>
  findOne: (selector?: string|MongoSelector<T>, options?: MongoFindOneOptions<T>, projection?: MongoProjection<T>) => Promise<T|null>
  findOneArbitrary: () => Promise<T|null>
  
  /**
   * Update without running callbacks. Consider using updateMutator, which wraps
   * this.
   *
   * Return result is number of documents **matched** not affected
   *
   * You might have expected that the return type would be MongoDB's
   * WriteResult. Unfortunately, no. Meteor was maintaining backwards
   * compatibility with an old version that returned nMatched. See:
   * https://github.com/meteor/meteor/issues/4436#issuecomment-283974686
   *
   * We then decided to maintain compatibility with meteor when we switched
   * away.
   */
  rawUpdateOne: (selector?: string|MongoSelector<T>, modifier?: MongoModifier<T>, options?: MongoUpdateOptions<T>) => Promise<number>
  rawUpdateMany: (selector?: string|MongoSelector<T>, modifier?: MongoModifier<T>, options?: MongoUpdateOptions<T>) => Promise<number>
  
  /** Remove without running callbacks. Consider using deleteMutator, which
   * wraps this. */
  rawRemove: (idOrSelector: string|MongoSelector<T>, options?: any) => Promise<any>
  /** Inserts without running callbacks. Consider using createMutator, which
   * wraps this. */
  rawInsert: (data: any, options?: any) => Promise<string>
  aggregate: (aggregationPipeline: MongoAggregationPipeline<T>, options?: any) => any
  _ensureIndex: any
}

interface CollectionOptions {
  typeName: string
  collectionName: CollectionNameString
  singleResolverName: string
  multiResolverName: string
  mutations: any
  resolvers: any
  interfaces: Array<string>
  description: string
  logChanges: boolean
}

interface FindResult<T> {
  fetch: ()=>Promise<Array<T>>
  count: ()=>Promise<number>
}

type ViewFunction<N extends CollectionNameString> = (terms: ViewTermsByCollectionName[N], apolloClient?: any, context?: ResolverContext)=>ViewQueryAndOptions<N>


type ViewQueryAndOptions<
  N extends CollectionNameString,
  T extends DbObject=ObjectsByCollectionName[N]
> = {
  selector?: Partial<Record<keyof T|"$or"|"$and", any>>
  options?: {
    sort?: MongoSort<T>
    limit?: number
    skip?: number
    projection?: MongoProjection<T>
    hint?: string
  }
}

interface MergedViewQueryAndOptions<
  N extends CollectionNameString,
  T extends DbObject=ObjectsByCollectionName[N]
> {
  selector: Partial<Record<keyof T|"$or"|"$and", any>>
  options: {
    sort: MongoSort<T>
    limit: number
    skip?: number
    hint?: string
  }
}

export type MongoSelector<T extends DbObject> = any; //TODO
type MongoProjection<T extends DbObject> = Partial<Record<keyof T, 0 | 1 | boolean>> | Record<string, any>;
type MongoModifier<T extends DbObject> = {$inc?: any, $min?: any, $max?: any, $mul?: any, $rename?: any, $set?: any, $setOnInsert?: any, $unset?: any, $addToSet?: any, $pop?: any, $pull?: any, $push?: any, $pullAll?: any, $bit?: any}; //TODO

type MongoFindOptions<T extends DbObject> = Partial<{
  sort: MongoSort<T>,
  limit: number,
  skip: number,
  projection: MongoProjection<T>,
  collation: CollationDocument,
}>;
type MongoFindOneOptions<T extends DbObject> = any; //TODO
type MongoUpdateOptions<T extends DbObject> = any; //TODO
type MongoRemoveOptions<T extends DbObject> = any; //TODO
type MongoInsertOptions<T extends DbObject> = any; //TODO
type MongoAggregationPipeline<T extends DbObject> = any; //TODO
type MongoAggregationOptions = CollectionAggregationOptions;
export type MongoSort<T extends DbObject> = Partial<Record<keyof T,number|null>>

type FieldOrDottedPath<T> = keyof T | `${keyof T&string}.${string}`
type MongoIndexKeyObj<T> = Partial<Record<FieldOrDottedPath<T>,1|-1|"2dsphere">>;
type MongoIndexFieldOrKey<T> = MongoIndexKeyObj<T> | string;
type MongoEnsureIndexOptions<T> = {
  partialFilterExpression?: Record<string, any>,
  unique?: boolean,
  name?: string,
  collation?: {
    locale: string,
    strength: number,
  },
}
type MongoIndexSpecification<T> = MongoEnsureIndexOptions<T> & {
  key: MongoIndexKeyObj<T>
}

type MongoDropIndexOptions = {};

type MongoBulkInsert<T extends DbObject> = {document: T};
type MongoBulkUpdate<T extends DbObject> = {filter: MongoSelector<T>, update: MongoModifier<T>, upsert?: boolean};
type MongoBulkDelete<T extends DbObject> = {filter: MongoSelector<T>};
type MongoBulkReplace<T extends DbObject> = {filter: MongoSelector<T>, replacement: T, upsert?: boolean};
type MongoBulkWriteOperation<T extends DbObject> =
  {insertOne: MongoBulkInsert<T>} |
  {updateOne: MongoBulkUpdate<T>} |
  {updateMany: MongoBulkUpdate<T>} |
  {deleteOne: MongoBulkDelete<T>} |
  {deleteMany: MongoBulkDelete<T>} |
  {replaceOne: MongoBulkReplace<T>};
type MongoBulkWriteOperations<T extends DbObject> = MongoBulkWriteOperation<T>[];
type MongoBulkWriteOptions = Partial<{
  ordered: boolean,
}>

type MakeFieldsNullable<T extends {}> = {[K in keyof T]: T[K]|null };

interface ViewTermsBase {
  view?: string
  limit?: number
  offset?: number
  orderBy?: any //FIXME: unused Vulcan thing
}

// Common base type for everything that has an _id field (including both raw DB
// objects and fragment-resolver results).
interface HasIdType {
  _id: string
}

// Common base type for everything with a userId field
interface HasUserIdType {
  userId: string
}

interface VoteableType extends HasIdType {
  score: number
  baseScore: number
  extendedScore: any,
  voteCount: number
  af?: boolean
  afBaseScore?: number
  afExtendedScore?: any,
  afVoteCount?: number
}

interface VoteableTypeClient extends VoteableType {
  currentUserVote: string|null
  currentUserExtendedVote?: any,
}

interface DbVoteableType extends VoteableType, DbObject, HasUserIdType {
}

// Common base type for results of database lookups.
interface DbObject extends HasIdType {
  __collectionName?: CollectionNameString
  schemaVersion: number
}

interface HasSlugType extends DbObject {
  slug: string
}

interface HasCreatedAtType extends DbObject {
  createdAt: Date
}

export type AlgoliaDocument = {
  _id: string,
  [key: string]: any,
}

interface ResolverContext extends CollectionsByName {
  headers: any,
  userId: string|null,
  clientId: string|null,
  currentUser: DbUser|null,
  visitorActivity: DbUserActivity|null,
  locale: string,
  isGreaterWrong: boolean,
  /**
   * This means that the request originated from the other FM instance's servers
   *
   * Do not set to true unless you have verified the authenticity of the request
   */
  isFMCrosspostRequest?: boolean,
  loaders: {
    [CollectionName in CollectionNameString]: DataLoader<string,ObjectsByCollectionName[CollectionName]>
  }
  extraLoaders: Record<string,any>
  req?: Request & {logIn: any, logOut: any, cookies: any, headers: any},
  res?: Response,
  repos: Repos,
}

type FragmentName = keyof FragmentTypes;

type VoteableCollectionName = "Posts"|"Comments"|"TagRels";
interface EditableFieldContents {
  html: string
  wordCount: number
  originalContents: DbRevision["originalContents"]
  editedAt: Date
  userId: string
  version: string
  commitMessage?: string
}

// The subset of EditableFieldContents that you provide when creating a new document
// or revision, ie, the parts of a revision which are not auto-generated.
type EditableFieldInsertion = Pick<EditableFieldContents, "originalContents"|"commitMessage">

// For a DbObject, gets the field-names of all the make_editable fields.
type EditableFieldsIn<T extends DbObject> = NonAnyFieldsOfType<T,EditableFieldContents>

type DbInsertion<T extends DbObject> = ReplaceFieldsOfType<T, EditableFieldContents, EditableFieldInsertion>

type SpotlightDocumentType = 'Post' | 'Sequence';
interface SpotlightFirstPost {
  _id: string;
  title: string;
  url: string;
}

// Sorry for declaring these so far from their function definitions. The
// functions are defined in /server, and import cycles, etc.

type CreateMutatorParams<T extends DbObject> = {
  collection: CollectionBase<T>,
  document: Partial<DbInsertion<T>>,
  currentUser?: DbUser|null,
  validate?: boolean,
  context?: ResolverContext,
};
type CreateMutator = <T extends DbObject>(args: CreateMutatorParams<T>) => Promise<{data: T}>;

type UpdateMutatorParamsBase<T extends DbObject> = {
  collection: CollectionBase<T>;
  data?: Partial<DbInsertion<T>>;
  set?: Partial<DbInsertion<T>>;
  unset?: any;
  currentUser?: DbUser | null;
  validate?: boolean;
  context?: ResolverContext;
  document?: T | null;
};
type UpdateMutatorParamsWithDocId<T extends DbObject> = UpdateMutatorParamsBase<T> & {
  documentId: string,
  /** You should probably use documentId instead. If using selector, make sure
   * it only returns a single row. */
  selector?: never
};
type UpdateMutatorParamsWithSelector<T extends DbObject> = UpdateMutatorParamsBase<T> & {
  documentId?: never,
  /** You should probably use documentId instead. If using selector, make sure
   * it only returns a single row. */
  selector: MongoSelector<T>
};
type UpdateMutatorParams<T extends DbObject> = UpdateMutatorParamsWithDocId<T> |
  UpdateMutatorParamsWithSelector<T>;

type UpdateMutator = <T extends DbObject>(args: UpdateMutatorParams<T>) => Promise<{ data: T }>;

type DeleteMutatorParams<T extends DbObject> = {
  collection: CollectionBase<T>,
  documentId: string,
  selector?: MongoSelector<T>,
  currentUser?: DbUser|null,
  validate?: boolean,
  context?: ResolverContext,
  document?: T|null,
};
type DeleteMutator = <T extends DbObject>(args: DeleteMutatorParams<T>) => Promise<{data: T}>


}
