import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  type UserRateLimitsViewTerms = Omit<ViewTermsBase, 'view'> & ({
    view: 'userRateLimits',
    userIds: string[],
    active?: boolean
  } | {
    view?: undefined | 'activeUserRateLimits',
    userIds?: undefined,
    active?: undefined
  })
}

function userRateLimits(terms: UserRateLimitsViewTerms) {
  const activeFilter = terms.active ? { $or: [{ endedAt: { $gt: new Date() } }, { endedAt: null }]} : {};
  return {
    selector: { userId: { $in: terms.userIds }, ...activeFilter },
    options: { sort: { createdAt: -1 } }
  };
}

function activeUserRateLimits(terms: UserRateLimitsViewTerms) {
  return {
    // Karma-lifted limits have no end date
    selector: { $or: [{ endedAt: { $gt: new Date() } }, { endedAt: null }] },
    options: { sort: { createdAt: -1 } }
  };
}

export const UserRateLimitsViews = new CollectionViewSet('UserRateLimits', {
  userRateLimits,
  activeUserRateLimits
});
