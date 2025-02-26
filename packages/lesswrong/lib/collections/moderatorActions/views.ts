import { restrictionModeratorActions } from './schema';
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  type ModeratorActionsViewTerms = Omit<ViewTermsBase, 'view'> & ({
    view: 'userModeratorActions',
    userIds: string[]
  } | {
    view?: undefined | 'restrictionModerationActions',
    userIds?: undefined
  })
}

function userModeratorActions(terms: ModeratorActionsViewTerms) {
  return {
    selector: { userId: { $in: terms.userIds } },
    options: { sort: { createdAt: -1 } }
  };
}

function restrictionModerationActions(terms: ModeratorActionsViewTerms) {
  return {
    selector: { type: { $in: restrictionModeratorActions }, endedAt: {$gt: new Date()} },
    options: { sort: { createdAt: -1 } }
  };
}

export const ModeratorActionsViews = new CollectionViewSet('ModeratorActions', {
  userModeratorActions,
  restrictionModerationActions
});
