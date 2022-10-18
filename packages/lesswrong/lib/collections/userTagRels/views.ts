import UserTagRels from "./collection";

declare global {
  interface UserTagRelsViewTerms extends ViewTermsBase {
    userId?: string,
    tagId?: string,
  }
}

UserTagRels.addView('single', ({userId, tagId}: UserTagRelsViewTerms) => {
  return ({
    selector: {
      userId,
      tagId,
    }
  });
})
