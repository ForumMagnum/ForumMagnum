import { UserPostEngagements } from './collection';

declare global {
  interface UserPostEngagementsTerms extends ViewTermsBase {
    view?: UserPostEngagementsViewName,
  }
}

UserPostEngagements.addDefaultView((terms: UserPostEngagementsTerms, _, context?: ResolverContext) => {
  const userId = context?.currentUser?._id;
  if (!userId) throw new Error("Requires a userId");
  return {
    selector: {
      userId,
    },
    sort: {
      lastInteractedAt: -1,
    },
  }
});
