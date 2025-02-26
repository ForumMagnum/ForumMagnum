import UserRateLimits from './collection';

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


UserRateLimits.addView('userRateLimits', function (terms: UserRateLimitsViewTerms) {
  const activeFilter = terms.active ? { $or: [{ endedAt: { $gt: new Date() } }, { endedAt: null }]} : {};
  return {
    selector: { userId: { $in: terms.userIds }, ...activeFilter },
    options: { sort: { createdAt: -1 } }
  };
});

UserRateLimits.addView('activeUserRateLimits', function (terms: UserRateLimitsViewTerms) {
  return {
    selector: { endedAt: { $gt: new Date() } },
    options: { sort: { createdAt: -1 } }
  };
});
