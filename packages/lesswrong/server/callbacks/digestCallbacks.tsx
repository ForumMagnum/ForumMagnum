import { getCollectionHooks } from '../mutationCallbacks';
import Digests from '../../lib/collections/digests/collection';
import { createMutator, updateMutator } from '../vulcan-lib/mutators';

getCollectionHooks("Digests").updateAsync.add(async ({document, oldDocument, context}: {document: DbDigest, oldDocument: DbDigest, context: ResolverContext}) => {
  // if we are not currently publishing this digest, skip
  if (!document.publishedDate || oldDocument.publishedDate) return
  // if a newer digest already exists, skip
  const newerDigest = await Digests.findOne({ num: {$gt: document.num} })
  if (newerDigest) return
  
  // when we first publish a digest, create the next one
  void createMutator({
    collection: Digests,
    document: {
      num: document.num + 1,
      startDate: document.endDate ?? new Date()
    },
    validate: false,
    context
  })
})

getCollectionHooks("Digests").updateAsync.add(async ({document, oldDocument, context}: {document: DbDigest, oldDocument: DbDigest, context: ResolverContext}) => {
  // if we change a digest's start date, make sure to update the preceeding digest's end date to match,
  // so that we don't miss any eligible posts
  if (document.startDate && document.startDate !== oldDocument.startDate) {
    void updateMutator({
      collection: Digests,
      selector: {
        num: document.num - 1,
      },
      set: {
        endDate: document.startDate,
      },
      validate: false,
    });
  }

  // if we change a digest's end date, make sure to update any subsequent digest's start date to match,
  // so that we don't miss any eligible posts
  if (document.endDate && document.endDate !== oldDocument.endDate) {
    void updateMutator({
      collection: Digests,
      selector: {
        num: document.num + 1,
      },
      set: {
        startDate: document.endDate,
      },
      validate: false,
    });
  }
});
