import { ensureIndex } from '../../collectionIndexUtils';
import ModeratorActions from './collection';
import { restrictionModeratorActions } from './schema';

declare global {
  type ModeratorActionsViewTerms = Omit<ViewTermsBase, 'view'> & ({
    view: 'userModeratorActions',
    userIds: string[]
  } | {
    view?: undefined | 'restrictionModerationActions',
    userIds?: undefined
  })
}

ModeratorActions.addView('userModeratorActions', function (terms: ModeratorActionsViewTerms) {
  return {
    selector: { userId: { $in: terms.userIds } },
    options: { sort: { createdAt: -1 } }
  };
})
ensureIndex(ModeratorActions, { userId: 1, createdAt: -1 })

ModeratorActions.addView('restrictionModerationActions', function (terms: ModeratorActionsViewTerms) {
  return {
    selector: { type: { $in: restrictionModeratorActions }, endedAt: {$gt: new Date()} },
    options: { sort: { createdAt: -1 } }
  };
})
ensureIndex(ModeratorActions, { type: 1, createdAt: -1, endedAt: -1 })
