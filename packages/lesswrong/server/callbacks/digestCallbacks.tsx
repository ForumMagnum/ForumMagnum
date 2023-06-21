import { getCollectionHooks } from '../mutationCallbacks';
import Digests from '../../lib/collections/digests/collection';
import { createMutator } from '../vulcan-lib/mutators';

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
