/*
 * Type definitions for mongo operations and our mongo collections
 *
 * This file could arguably be .d.ts (and it did use to be), but when it was, it
 * was getting ignored by the type checker as an external library file, as
 * --skipLibCheck just ignores all .d.ts files.
 */

interface CollectionBase<T extends DbObject> {
  collectionName: CollectionNameString
  typeName: string,
  options: any
  
  addDefaultView: any
  addView: any
  defaultView: (terms: any) => any
  views: any
  getParameters: any
  simpleSchema: any
  addField: any
  helpers: any
  
  // TODO: Type-system plumbing should handle the fact that loaders are available
  // if you get the collection via a resolver's context, but not available if you
  // just import the collection.
  loader: any
  extraLoaders: Record<string,any>
  
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

interface FindResult<T> {
  fetch: ()=>Array<T>
  count: ()=>number
}

type MongoSelector<T extends DbObject> = Record<string,any>; //TODO
type MongoProjection<T extends DbObject> = Record<string,number>; //TODO
type MongoModifier<T extends DbObject> = any; //TODO: Mostly $set/$unset, but has a bunch of assorted other operations, should use a DefinitelyTyped definition
type SimpleModifier<T extends {}> = {$set: Partial<Nullable<T>>, $unset?: Partial<Record<keyof T,any>>}

type MongoFindOptions<T extends DbObject> = any; //TODO
type MongoFindOneOptions<T extends DbObject> = any; //TODO
type MongoUpdateOptions<T extends DbObject> = any; //TODO
type MongoRemoveOptions<T extends DbObject> = any; //TODO
type MongoInsertOptions<T extends DbObject> = any; //TODO

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
  af: boolean
  afBaseScore: number
}

interface VoteableTypeClient extends VoteableType {
  currentUserVotes: Array<VoteFragment>
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
  currentUser: DbUser|null,
  locale: string,
}
