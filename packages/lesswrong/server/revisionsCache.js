import LRU from 'lru-cache';

const maxRevisionCacheSizeBytes = 128*1024*1024; //128MB

export const revisionsCache = new LRU({
  max: maxRevisionCacheSizeBytes,
  length: (revision,id) => JSON.stringify(revision).length,
});

// Load a revision, from the revisions cache. If not in the cache, use the
// provided dataloader.
export async function loadRevision({loader, id}) {
  const cachedResult = revisionsCache.get(id);
  if (cachedResult !== undefined) {
    return cachedResult;
  }
  
  const fromDatabaseResult = await loader.load(id);
  revisionsCache.set(id, fromDatabaseResult);
  return fromDatabaseResult;
}

// Return a computed field based on a revision, such as a table of contents or
// a truncated version. First this loads the revision from the revision cache,
// and checks whether the field is already present. If it isn't, computes the
// field, adds it to the cached revision, and and puts it back into the
// revisions cache with the field added.
export async function revisionCacheComputedField(revisionID, fieldName, loader, computeField) {
  const revision = await loadRevision({loader, id:revisionID});
  if (fieldName in revision) {
    return revision[fieldName];
  }
  
  revision[fieldName] = await computeField();
  revisionsCache.set(revision._id, revision);
  return revision[fieldName];
}
