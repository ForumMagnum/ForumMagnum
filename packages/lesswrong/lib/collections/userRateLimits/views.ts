import { CollectionViewSet } from '../../../lib/views/collectionViewSet';
import { getActiveUserRateLimitSelector } from './helpers';

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
  const activeFilter = terms.active ? getActiveUserRateLimitSelector() : {};
  return {
    selector: { userId: { $in: terms.userIds }, ...activeFilter },
    options: { sort: { createdAt: -1 } }
  };
}

function activeUserRateLimits(terms: UserRateLimitsViewTerms) {
  return {
    selector: getActiveUserRateLimitSelector(),
    options: { sort: { createdAt: -1 } }
  };
}

export const UserRateLimitsViews = new CollectionViewSet('UserRateLimits', {
  userRateLimits,
  activeUserRateLimits
});
