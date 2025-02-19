import { ensureIndex } from "../../collectionIndexUtils";
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

ensureIndex(UserTagRels, {tagId:1, userId:1}, {unique: true});
