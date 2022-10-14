import { ensureIndex } from '../../collectionUtils';
import ModeratorActions from './collection';

declare global {
  type ModeratorActionsViewTerms = ViewTermsBase & {
    view: 'userModeratorActions',
    userIds: string[]
  }
  // interface ModeratorActionsViewTerms extends ViewTermsBase {
  //   view?: ModeratorActionsViewName,
  //   userId?: string
  // }
}

ModeratorActions.addView('userModeratorActions', function (terms: ModeratorActionsViewTerms) {
  return {
    selector: { userId: { $in: terms.userIds } },
    options: { sort: { createdAt: -1 } }
  };
})
ensureIndex(ModeratorActions, { userId: 1, createdAt: -1 })