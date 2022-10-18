import { ensureIndex } from '../../collectionUtils';
import ModeratorActions from './collection';

declare global {
  type ModeratorActionsViewTerms = Omit<ViewTermsBase, 'view'> & ({
    view: 'userModeratorActions',
    userIds: string[]
  } | {
    view?: undefined,
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