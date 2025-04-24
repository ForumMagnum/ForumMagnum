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
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import type { CollectionVoteOptions } from '../make_voteable';
import type { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

// These server imports are safe as they use `import type`
// eslint-disable-next-line import/no-restricted-paths
import type Table from '@/server/sql/Table';
// eslint-disable-next-line import/no-restricted-paths
import type { BulkWriterResult } from '@/server/sql/BulkWriter';

/// This file is wrapped in 'declare global' because it's an ambient declaration
/// file (meaning types in this file can be used without being imported).
declare global {

type CheckAccessFunction<N extends CollectionNameString> = (
  user: DbUser|null,
  obj: ObjectsByCollectionName[N],
  context: ResolverContext,
  outReasonDenied?: {reason?: string},
) => Promise<boolean>;

interface CollectionBase<N extends CollectionNameString = CollectionNameString> {
  collectionName: N,
  postProcess?: (data: ObjectsByCollectionName[N]) => ObjectsByCollectionName[N];
  typeName: string,
  options: CollectionOptions<N>,

  isConnected: () => boolean
  isVoteable: () => this is CollectionBase<VoteableCollectionName>;
  hasSlug: () => boolean
  getTable: () => Table<ObjectsByCollectionName[N]>;
  getIndexes: () => DatabaseIndexSet;

  rawCollection: () => {
    bulkWrite: (operations: MongoBulkWriteOperations<ObjectsByCollectionName[N]>, options?: MongoBulkWriteOptions) => Promise<BulkWriterResult>,
    findOneAndUpdate: any,
    dropIndex: any,
    updateOne: any,
    updateMany: any
  }
  find: FindFn<ObjectsByCollectionName[N]>;
  findOne: FindOneFn<ObjectsByCollectionName[N]>;
  findOneArbitrary: () => Promise<ObjectsByCollectionName[N]|null>
  
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
  rawUpdateOne: (
    selector?: string|MongoSelector<ObjectsByCollectionName[N]>,
    modifier?: MongoModifier,
    options?: MongoUpdateOptions<ObjectsByCollectionName[N]>,
  ) => Promise<number>;
  rawUpdateMany: (
    selector?: string|MongoSelector<ObjectsByCollectionName[N]>,
    modifier?: MongoModifier,
    options?: MongoUpdateOptions<ObjectsByCollectionName[N]>,
  ) => Promise<number>;

  rawRemove: (idOrSelector: string|MongoSelector<ObjectsByCollectionName[N]>, options?: any) => Promise<any>
  /** Inserts without running callbacks. Consider using createMutator, which
   * wraps this. */
  rawInsert: (data: any, options?: any) => Promise<string>
  aggregate: (aggregationPipeline: MongoAggregationPipeline<ObjectsByCollectionName[N]>, options?: any) => any
  _ensureIndex: (fieldOrSpec: MongoIndexFieldOrKey<ObjectsByCollectionName[N]>, options?: MongoEnsureIndexOptions<ObjectsByCollectionName[N]>) => Promise<void>
}

type CollectionOptions<N extends CollectionNameString> = {
  typeName: string,
  collectionName: N,
  dbCollectionName?: string,
  writeAheadLogged?: boolean,
  dependencies?: SchemaDependency[],
  voteable?: CollectionVoteOptions,
  getIndexes?: () => DatabaseIndexSet,
};

interface FindResult<T> {
  fetch: () => Promise<Array<T>>
  count: () => Promise<number>
}

type ViewFunction<N extends CollectionNameString = CollectionNameString> = (
  terms: ViewTermsByCollectionName[N],
  apolloClient?: ApolloClient<NormalizedCacheObject>,
  context?: ResolverContext,
) => ViewQueryAndOptions<N>;


type ViewQueryAndOptions<
  N extends CollectionNameString,
  T extends DbObject=ObjectsByCollectionName[N]
> = {
  selector?: Partial<Record<keyof T|"$or"|"$and", any>> | {}
  options?: {
    sort?: MongoSort<T>
    limit?: number
    skip?: number
    projection?: MongoProjection<T>
    hint?: string
  }
}

interface MergedViewQueryAndOptions<T extends DbObject> {
  selector: Partial<Record<keyof T|"$or"|"$and", any>>
  options: {
    sort: MongoSort<T>
    limit: number
    skip?: number
    hint?: string
  }
  syntheticFields?: Partial<Record<keyof T, MongoSelector<T>>>
}

type ApplyProjection<
  T extends DbObject,
  Projection extends MongoProjection<T> | undefined
> =
  Projection extends undefined
    ? T // If no projection, return the raw DbObject
    :
      Omit< // Otherwise, calculate the included and excluded fields
        Pick< // Include fields from T marked with 1 or true in the projection
          T,
          keyof Projection & keyof T & {
            [K in keyof Projection]: Projection[K] extends 1 | true ? K : never;
          }[keyof Projection]
        >,
        { // Exclude fields from T marked with 0 or false in the projection
          [K in keyof Projection]: Projection[K] extends 0 | false ? K : never;
        }[keyof Projection]
      > & (
        Projection extends {_id: 0 | false} // Include id unless explicitly excluded
          ? {}
          : {_id: T extends {_id: infer IdType} ? IdType : never}
      ) & {
        // Include arbitrary fields not in T with type `unknown`
        [K in Exclude<keyof Projection, keyof T>]: Projection[K] extends 1 | true
          ? unknown
          : never;
      };

export type MongoSelector<T extends DbObject> = any; //TODO
type MongoExpression<T extends DbObject> = `$${keyof T & string}` | { [k in `$${string}`]: any }
type MongoProjection<T extends DbObject> = { [K in keyof T]?: 0 | 1 | boolean } | Record<string, MongoExpression<T>>;
type MongoModifier = {$inc?: any, $min?: any, $max?: any, $mul?: any, $rename?: any, $set?: any, $setOnInsert?: any, $unset?: any, $addToSet?: any, $pop?: any, $pull?: any, $push?: any, $pullAll?: any, $bit?: any}; //TODO

type FindFn<T extends DbObject> = <Projection extends MongoProjection<T> | undefined = undefined>(
  selector?: string | MongoSelector<T>,
  options?: MongoFindOptions<T>,
  projection?: Projection
) => FindResult<ApplyProjection<T, Projection>>;

type MongoFindOptions<T extends DbObject> = Partial<{
  sort: MongoSort<T>,
  limit: number,
  skip: number,
  
  // FIXME This option is actually ignored (the correct place for a projection
  // is in the third argument of `find`). However removing it from the type
  // annotation here exposes a bunch of places that thought they were doing a
  // projection but weren't, which then need a bunch of related type-annotation
  // changes to account for that, and need to be checked to make sure they
  // aren't actually relying on a field that they projected away.
  projection: MongoProjection<T>,

  collation: CollationDocument,
  comment?: string,
}>;

type FindOneFn<T extends DbObject> = <Projection extends MongoProjection<T> | undefined = undefined>(
  selector?: string | MongoSelector<T>,
  options?: MongoFindOneOptions<T>,
  projection?: Projection
) => Promise<ApplyProjection<T, Projection> | null>;

type MongoFindOneOptions<T extends DbObject> = Partial<{
  sort: MongoSort<T>

  // Projection is a third argument to findOne, not something that goes in the
  // options array
  projection: never
}>;

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
  concurrently?: boolean,
  name?: string,
  collation?: {
    locale: string,
    strength: number,
  },
}
type MongoIndexSpecification<T> = {
  key: MongoIndexKeyObj<T>
  options: MongoEnsureIndexOptions<T>
}

type MongoDropIndexOptions = {};

type MongoBulkInsert<T extends DbObject> = {document: T};
type MongoBulkUpdate<T extends DbObject> = {filter: MongoSelector<T>, update: MongoModifier, upsert?: boolean};
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

type HasIdCollectionNames = Exclude<Extract<ObjectsByCollectionName[CollectionNameString], HasIdType>['__collectionName'], undefined>;

// Common base type for everything with a userId field
interface HasUserIdType {
  userId: string | null
}

interface VoteableType extends HasIdType {
  score: number
  baseScore: number | null
  extendedScore: any,
  voteCount: number
  af?: boolean
  afBaseScore?: number | null
  afExtendedScore?: any,
  afVoteCount?: number | null
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

interface HasSlugType {
  slug: string
}

interface HasCreatedAtType extends DbObject {
  createdAt: Date
}

export type SearchDocument = {
  _id: string,
  [key: string]: any,
}

interface PerfMetric {
  trace_id: string;
  op_type: string;
  op_name: string;
  started_at: Date;
  ended_at: Date;
  parent_trace_id?: string;
  client_path?: string;
  extra_data?: Json;
  gql_string?: string;
  sql_string?: string;
  ip?: string;
  user_agent?: string;
  user_id?: string;
  render_started_at?: Date;
  queue_priority?: number;
}

type IncompletePerfMetric = Omit<PerfMetric, 'ended_at'>;

interface ResolverContext extends CollectionsByName {
  headers: any,
  userId: string|null,
  clientId: string|null,
  currentUser: DbUser|null,
  visitorActivity: DbUserActivity|null,
  locale: string,
  isSSR: boolean,
  isGreaterWrong: boolean,
  isIssaRiceReader: boolean,
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
  perfMetric?: IncompletePerfMetric,
}

type FragmentName = keyof FragmentTypes;
type CollectionFragmentTypeName = {
  [k in keyof FragmentTypes]: CollectionNamesByFragmentName[k] extends never ? never : k;
}[keyof FragmentTypes];

type VoteableCollectionName = "Posts"|"Comments"|"TagRels"|"Revisions"|"ElectionCandidates"|"Tags"|"MultiDocuments";

interface EditableFieldContents {
  html: string
  wordCount: number
  originalContents: DbRevision["originalContents"]
  editedAt: Date
  userId: string
  version: string
  commitMessage?: string | null
  googleDocMetadata?: AnyBecauseHard
}

// The subset of EditableFieldContents that you provide when creating a new document
// or revision, ie, the parts of a revision which are not auto-generated.
type EditableFieldInsertion = Pick<EditableFieldContents, "originalContents"|"commitMessage"|"googleDocMetadata">

type EditableFieldUpdate = EditableFieldInsertion & {
  dataWithDiscardedSuggestions?: string,
  updateType?: DbRevision['updateType'] | null,
};

// For a DbObject, gets the field-names of all the make_editable fields.
type EditableFieldsIn<T extends DbObject> = NonAnyFieldsOfType<T,EditableFieldContents>

type EditableCollectionNames = {
  [k in CollectionNameString]: EditableFieldsIn<ObjectsByCollectionName[k]> extends undefined ? never : k;
}[CollectionNameString];

type CollectionNameOfObject<T extends DbObject> = Exclude<T['__collectionName'], undefined>;

type DbInsertion<T extends DbObject> = Omit<
  ReplaceFieldsOfType<T, EditableFieldContents | null, CreateRevisionDataInput>,
  "_id"
>

type SpotlightDocumentType = 'Post' | 'Sequence' | 'Tag';

type CollectionNameWithPingbacks = {
  [K in CollectionNameString]: 'pingbacks' extends keyof ObjectsByCollectionName[K] ? K : never
}[CollectionNameString];
}
