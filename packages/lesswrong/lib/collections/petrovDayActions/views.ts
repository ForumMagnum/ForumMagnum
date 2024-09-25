import { ensureIndex } from "@/lib/collectionIndexUtils";
import { PetrovDayActions } from "./collection"

declare global {
  interface PetrovDayActionsViewTerms extends ViewTermsBase {
    userId?: string,
    actionType?: string,
    data?: any,
  }
}


//Messages for a specific conversation
PetrovDayActions.addView("getAction", (terms: PetrovDayActionsViewTerms) => {
  const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
  const userId = terms.userId ? {userId: terms.userId} : {}
  return {
    selector: {
      ...userId,
      createdAt: {$gte: oneWeekAgo},
      actionType: terms.actionType,
    }
  };
});
ensureIndex(PetrovDayActions, {userId: 1, actionType: 1});
