/*
 * Type definitions for mongo operations and our mongo collections
 *
 * This file could arguably be .d.ts (and it did use to be), but when it was, it
 * was getting ignored by the type checker as an external library file, as
 * --skipLibCheck just ignores all .d.ts files.
 */
import type DataLoader from 'dataloader';
import type { Request, Response } from 'express';

/// This file is wrapped in 'declare global' because it's an ambient declaration
/// file (meaning types in this file can be used without being imported).
declare global {

interface CollectionBase<
  T extends DbObject,
  N extends CollectionNameString = CollectionNameString
> {
  collectionName: N
  typeName: string,
  options: CollectionOptions
  addDefaultView: (view: ViewFunction<N>) => void
  addView: (viewName: string, view: ViewFunction<N>) => void
  defaultView: ViewFunction<N> //FIXME: This is actually nullable (but should just have a default)
  views: Record<string, ViewFunction<N>>
  getParameters: (terms: ViewTermsByCollectionName[N], apolloClient?: any, context?: ResolverContext) => MergedViewQueryAndOptions<N,T>
  
  _schemaFields: SchemaType<T>
  _simpleSchema: any
  
  rawCollection: ()=>{bulkWrite: any, findOneAndUpdate: any, dropIndex: any, indexes: any, update: any}
  checkAccess: (user: DbUser|null, obj: T, context: ResolverContext|null) => Promise<boolean>
  find: (selector?: MongoSelector<T>, options?: MongoFindOptions<T>, projection?: MongoProjection<T>) => FindResult<T>
  findOne: (selector?: string|MongoSelector<T>, options?: MongoFindOneOptions<T>, projection?: MongoProjection<T>) => Promise<T|null>
  // Return result is number of documents **matched** not affected
  //
  // You might have expected that the return type would be MongoDB's WriteResult. Unfortunately, no.
  // Meteor is maintaining backwards compatibility with an old version that returned nMatched. See:
  // https://github.com/meteor/meteor/issues/4436#issuecomment-283974686
  update: (selector?: string|MongoSelector<T>, modifier?: MongoModifier<T>, options?: MongoUpdateOptions<T>) => Promise<number>
  remove: (idOrSelector: string|MongoSelector<T>, options?: any) => Promise<any>
  insert: (data: any, options?: any) => Promise<string>
  aggregate: (aggregationPipeline: MongoAggregationPipeline<T>, options?: any) => any
  _ensureIndex: any
  _ensurePgIndex: (indexName: string, indexDescription: string)=>Promise<void>
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
  }
}

type MongoSelector<T extends DbObject> = any; //TODO
type MongoProjection<T extends DbObject> = Record<string,number>; //TODO
type MongoModifier<T extends DbObject> = any; //TODO

type MongoFindOptions<T extends DbObject> = any; //TODO
type MongoFindOneOptions<T extends DbObject> = any; //TODO
type MongoUpdateOptions<T extends DbObject> = any; //TODO
type MongoRemoveOptions<T extends DbObject> = any; //TODO
type MongoInsertOptions<T extends DbObject> = any; //TODO
type MongoAggregationPipeline<T extends DbObject> = any; //TODO
type MongoSort<T extends DbObject> = Partial<Record<keyof T,number|null>>

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

interface VoteableType extends HasIdType, HasUserIdType {
  score: number
  baseScore: number
  voteCount: number
  af?: boolean
  afBaseScore?: number
  afVoteCount?: number
}

interface VoteableTypeClient extends VoteableType {
  currentUserVote: string|null
}

interface DbVoteableType extends VoteableType, DbObject {
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
  currentUser: DbUser|null,
  locale: string,
  loaders: {
    [CollectionName in CollectionNameString]: DataLoader<string,ObjectsByCollectionName[CollectionName]>
  }
  extraLoaders: Record<string,any>
  req?: Request & {logIn: any, logOut: any, cookies: any, headers: any},
  res?: Response
}

type FragmentName = keyof FragmentTypes;

type VoteableCollectionName = "Posts"|"Comments"|"TagRels";
interface EditableFieldContents {
  html: string
  wordCount: number
  originalContents: any
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

}
