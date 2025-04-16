export function getTextLastUpdatedAtFieldResolver<T extends CollectionNameString>(collectionName: T) {
  return async function textLastUpdatedAtFieldResolver(doc: ObjectsByCollectionName[T], args: void, context: ResolverContext) {
    const { Revisions } = context;

    const [changedRevision, lastRevision] = await Promise.all([
      // Query 1: Get the most recent revision with text changes
      Revisions.findOne(
        { 
          documentId: doc._id, 
          collectionName,
          $or: [
            { "changeMetrics.added": { $gt: 1 } },
            { "changeMetrics.removed": { $gt: 1 } }
          ]
        },
        { 
          sort: { editedAt: -1 }
        }
      ),
      
      // Query 2: Get the most recent revision unconditionally
      Revisions.findOne(
        { documentId: doc._id, collectionName },
        { 
          sort: { editedAt: -1 }
        }
      )
    ]);

    // Return the editedAt date from the changed revision if available, otherwise from the last revision
    return changedRevision?.editedAt || lastRevision?.editedAt || null;
  }
}
