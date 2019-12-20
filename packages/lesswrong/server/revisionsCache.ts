import LRU from 'lru-cache';
import Revisions from '../lib/collections/revisions/collection.js';
import { Mongo } from 'meteor/mongo';
import DataLoader from 'dataloader';

const maxRevisionCacheSizeBytes = 128*1024*1024; //128MB

export const revisionsCache = new LRU({
  max: maxRevisionCacheSizeBytes,
  length: (revision,id) => JSON.stringify(revision).length,
});

type serializedObjectId = {_str:string};
type idOrObjectId = string | serializedObjectId;

// Given a mongo database ID which is either a string, or the serialization of
// an ObjectID, unpack into a cache key (which is definitely a string) and a
// query key (which is either a string or a Mongo.ObjectID).
function unpackIdOrObjectId(id: idOrObjectId): {cacheKey: string|null, queryKey: any}
{
  if (!id) {
    return { cacheKey: null, queryKey: null };
  }
  
  const cacheKey: string = (id as serializedObjectId)._str || (id as string);
  if ((id as serializedObjectId)._str)
    id = new Mongo.ObjectID((id as serializedObjectId)._str);
  
  if ((id as serializedObjectId)._str) {
    const idStr = (id as serializedObjectId)._str;
    return {
      cacheKey: idStr,
      queryKey: new Mongo.ObjectID(idStr),
    }
  } else {
    const idStr = id as string;
    return {
      cacheKey: idStr,
      queryKey: idStr,
    }
  }
}

// Given a value which might or might not be a promise (ie, the return of a
// function where you're not sure whether it's async), return a wrapped version
// which is definitely a promise.
function maybeAsyncToDefinitelyAsync<T>(maybePromise: T|Promise<T>): Promise<T>
{
  if ((maybePromise as Promise<T>).then) {
    return (maybePromise as Promise<T>);
  } else {
    return Promise.resolve(maybePromise as T);
  }
}

// Load a revision, from the revisions cache. If not in the cache, use the
// provided dataloader. Returns a promise for a revision.
export function loadRevision({loader, id}: {loader: DataLoader<any,any>, id: idOrObjectId}) {
  const { cacheKey, queryKey } = unpackIdOrObjectId(id);
  
  const cachedResult = revisionsCache.get(cacheKey);
  if (cachedResult !== undefined)
    return Promise.resolve(cachedResult);
  
  return new Promise((resolve, reject) => {
    loader.load(queryKey).then(fromDatabaseResult => {
      revisionsCache.set(cacheKey, fromDatabaseResult);
      resolve(fromDatabaseResult);
    });
  });
}

// Return a computed field based on a revision, such as a table of contents or
// a truncated version. First this loads the revision from the revision cache,
// and checks whether the field is already present. If it isn't, computes the
// field, adds it to the cached revision, and and puts it back into the
// revisions cache with the field added.
// Returns either the computed field value, or a promise for it.
export function revisionCacheComputedField<T>({ revision, fieldName, loader, computeField }: {
  revision: any,
  fieldName: string,
  loader: DataLoader<any,any>,
  computeField: ((rev)=>Promise<T>) | ((rev)=>T) // Optionally async
}): Promise<T>
{
  const revisionID: idOrObjectId = revision._id;
  const { cacheKey } = unpackIdOrObjectId(revisionID);
  
  // Happy path: revision is cached and the field is cached
  const cachedRevision = revisionsCache.get(cacheKey);
  if (cachedRevision && fieldName in cachedRevision) {
    return Promise.resolve(cachedRevision[fieldName]);
  }
  
  // Either the revision isn't cached, or it's cached but the field isn't
  return new Promise((resolve, reject) => {
    loadRevision({loader, id:revisionID})
      .then(revision => {
        const computeFieldResult = computeField(revision);
        const computeFieldPromise = maybeAsyncToDefinitelyAsync(computeFieldResult);
        
        computeFieldPromise.then((computedValue: T) => {
          if (revision) {
            revision[fieldName] = computedValue;
            revisionsCache.set(cacheKey, revision);
          }
          resolve(computedValue);
        });
      }
    )
  });
}
