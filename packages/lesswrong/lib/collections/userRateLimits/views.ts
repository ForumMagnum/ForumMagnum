import { ensureIndex } from '../../collectionIndexUtils';
import UserRateLimits from './collection';
// import { restrictionModeratorActions } from './schema';

declare global {
  type UserRateLimitsViewTerms = Omit<ViewTermsBase, 'view'> & ({
    view: 'userRateLimits',
    userIds: string[]
  } | {
    view?: undefined | 'activeUserRateLimits',
    userIds?: undefined
  })
}

UserRateLimits.addView('userRateLimits', function (terms: UserRateLimitsViewTerms) {
  return {
    selector: { userId: { $in: terms.userIds } },
    options: { sort: { createdAt: -1 } }
  };
})
// ensureIndex(UserRateLimits, { userId: 1, createdAt: -1 })

UserRateLimits.addView('activeUserRateLimits', function (terms: UserRateLimitsViewTerms) {
  return {
    selector: { endedAt: {$gt: new Date()} },
    options: { sort: { createdAt: -1 } }
  };
})
// ensureIndex(UserRateLimits, { type: 1, createdAt: -1, endedAt: -1 })
