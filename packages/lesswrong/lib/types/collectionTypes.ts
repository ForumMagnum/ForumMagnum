/*
 * Type definitions for mongo operations and our mongo collections
 *
 * This file could arguably be .d.ts (and it did use to be), but when it was, it
 * was getting ignored by the type checker as an external library file, as
 * --skipLibCheck just ignores all .d.ts files.
 */
import DataLoader from 'dataloader';

/// This file is wrapped in 'declare global' because it's an ambient declaration
/// file (meaning types in this file can be used without being imported).
declare global {

interface CollectionBase<T extends DbObject> {
  collectionName: CollectionNameString
  typeName: string,
  options: CollectionOptions
  addDefaultView: any
  addView: any
  defaultView: (terms: any) => any
  views: any
  getParameters: any
  simpleSchema: any
  addField: any
  helpers: any
  
  rawCollection: any
  checkAccess: (user: DbUser|null, obj: T, context: ResolverContext|null) => Promise<boolean>
  find: (selector?: MongoSelector<T>, options?: MongoFindOptions<T>, projection?: MongoProjection<T>) => FindResult<T>
  findOne: (selector?: string|MongoSelector<T>, options?: MongoFindOneOptions<T>, projection?: MongoProjection<T>) => T | null
  // Return result is number of documents **matched** not affected
  //
  // You might have expected that the return type would be MongoDB's WriteResult. Unfortunately, no.
  // Meteor is maintaining backwards compatibility with an old version that returned nMatched. See:
  // https://github.com/meteor/meteor/issues/4436#issuecomment-283974686
  update: (selector?: string|MongoSelector<T>, modifier?: MongoModifier<T>, options?: MongoUpdateOptions<T>) => number
  remove: any
  insert: any
  aggregate: any
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
}

interface FindResult<T> {
  fetch: ()=>Array<T>
  count: ()=>number
}

type MongoSelector<T extends DbObject> = Record<string,any>; //TODO
type MongoProjection<T extends DbObject> = Record<string,number>; //TODO
type MongoModifier<T extends DbObject> = any; //TODO

type MongoFindOptions<T extends DbObject> = any; //TODO
type MongoFindOneOptions<T extends DbObject> = any; //TODO
type MongoUpdateOptions<T extends DbObject> = any; //TODO
type MongoRemoveOptions<T extends DbObject> = any; //TODO
type MongoInsertOptions<T extends DbObject> = any; //TODO

interface ViewTermsBase {
  limit?: number
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
  schemaVersion: number
}

interface HasSlugType extends DbObject {
  slug: string
}

interface HasCreatedAtType extends DbObject {
  createdAt: Date
}

interface ResolverContext extends CollectionsByName {
  headers: any,
  userId: string|null,
  currentUser: DbUser|null,
  locale: string,
  loaders: Record<CollectionNameString, DataLoader<string,any>>
  extraLoaders: Record<string,any>
}

type FragmentName = keyof FragmentTypes;

}
