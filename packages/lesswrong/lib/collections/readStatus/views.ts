import ReadStatuses from "./collection";

declare global {
  interface UserReadStatusesViewTerms {
    view: 'userReadStatuses',
    userId: string | undefined
    limit: number
  }

  type ReadStatusesViewTerms = Omit<ViewTermsBase, 'view'> & (UserReadStatusesViewTerms | {
    view?: undefined,
    userId?: never
  })
}

ReadStatuses.addView('userReadStatuses', (terms: UserReadStatusesViewTerms) => {
  return {
    selector: { userId: terms.userId },
    options: {
      sort: { lastUpdated: -1 },
      limit: terms.limit ?? 50,
    }
  };
});
