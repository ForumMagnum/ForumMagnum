import LRU from 'lru-cache';
import Revisions from '../lib/collections/revisions/collection';
import { Mongo } from 'meteor/mongo';
import DataLoader from 'dataloader';
import findByIds from './vulcan-lib/findbyids';

const maxRevisionCacheSizeBytes = 128*1024*1024; //128MB

const revisionDataLoader = new DataLoader<string, DbRevision|null>((ids: Array<string>) => findByIds(Revisions, ids), {cache: true});

// MongoDB has an "ObjectID" type, which is sometimes used in place of string
// IDs. When serialized, it turns into {_str:string}.
type serializedObjectId = {_str:string};
type idOrObjectId = string | serializedObjectId;

export const revisionsCache = new LRU<string,DbRevision>({
  max: maxRevisionCacheSizeBytes,
  length: (revision: DbRevision, id: string) => JSON.stringify(revision).length,
});

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
export function getRevisionById(id: string): Promise<DbRevision|null> {
  const cachedResult = revisionsCache.get(id);
  if (cachedResult !== undefined) {
    return Promise.resolve(cachedResult);
  }

  return new Promise((resolve, reject) => {
    void revisionDataLoader.load(id).then(fromDatabaseResult => {
      if (fromDatabaseResult) {
        revisionsCache.set(id, fromDatabaseResult);
      }
      resolve(fromDatabaseResult);
    });
  });
}

export async function loadRevision<T extends DbObject>({collection, doc, fieldName}: {
  collection: CollectionBase<T>,
  doc: T|null,
  fieldName?: string,
}): Promise<DbRevision|null> {
  if (!doc)
    return null;
  if (doc[fieldName ? `${fieldName}_latest` : "contents_latest"]) {
    const id = doc[fieldName ? `${fieldName}_latest` : "contents_latest"]
    return await getRevisionById(id);
  } else if (doc[fieldName || "contents"]) {
    return doc[fieldName || "contents"];
  } else {
    return null;
  }
}

// Return a computed field based on a revision, such as a table of contents or
// a truncated version. First this loads the revision from the revision cache,
// and checks whether the field is already present. If it isn't, computes the
// field, adds it to the cached revision, and and puts it back into the
// revisions cache with the field added.
// Returns either the computed field value, or a promise for it.
export function revisionCacheComputedField<T>({ revision, fieldName, computeField }: {
  revision: DbRevision,
  fieldName: string,
  computeField: ((rev: DbRevision|null)=>Promise<T>) | ((rev: DbRevision|null)=>T) // Optionally async
}): T|Promise<T>
{
  const revisionID: string = revision._id;
  
  if (!revisionID) {
    return computeField(revision);
  }

  // Happy path: revision is cached and the field is cached
  const cachedRevision = revisionsCache.get(revisionID);
  if (cachedRevision && fieldName in cachedRevision) {
    return Promise.resolve(cachedRevision[fieldName]);
  }

  // Either the revision isn't cached, or it's cached but the field isn't
  return new Promise((resolve, reject) => {
    void getRevisionById(revisionID)
      .then(revision => {
        const computeFieldResult = computeField(revision);
        const computeFieldPromise = maybeAsyncToDefinitelyAsync(computeFieldResult);

        void computeFieldPromise.then((computedValue: T) => {
          if (revision) {
            revision[fieldName] = computedValue;
            revisionsCache.set(revisionID, revision);
          }
          resolve(computedValue);
        });
      }
    )
  });
}
