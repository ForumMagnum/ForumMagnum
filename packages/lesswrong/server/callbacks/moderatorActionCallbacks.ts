import { getCollectionHooks } from '../mutationCallbacks';
import { triggerReviewIfNeeded } from './sunshineCallbackUtils';

getCollectionHooks('ModeratorActions').createAfter.add(async function triggerReview(doc) {
  void triggerReviewIfNeeded(doc.userId, true);
});