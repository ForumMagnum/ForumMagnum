import { CollectionViewSet } from "@/lib/views/collectionViewSet";

declare global {
  interface UserBlocksViewTerms extends ViewTermsBase {
    view?: UserBlocksViewName
    userId?: string
    blockedUserId?: string
    blocked?: boolean
  }
}

function userAndBlockedUser(terms: UserBlocksViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      blockedUserId: terms.blockedUserId,
      ...(typeof terms.blocked === "boolean" ? { blocked: terms.blocked } : {}),
    },
    options: {
      limit: 1,
    },
  };
}

export const UserBlocksViews = new CollectionViewSet("UserBlocks", {
  userAndBlockedUser,
});
