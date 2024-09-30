import { ensureIndex } from "@/lib/collectionIndexUtils";
import { PetrovDayActions } from "./collection"
import { PetrovDayActionType } from "./schema";

declare global {
  interface PetrovDayActionsViewTerms extends ViewTermsBase {
    userId?: string,
    actionType?: PetrovDayActionType,
    data?: any,
    side?: 'east' | 'west'
  }
}

//Messages for a specific conversation
PetrovDayActions.addView("getAction", (terms: PetrovDayActionsViewTerms) => {
  const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
  const userId = terms.userId ? {userId: terms.userId} : {}
  const actionType = terms.actionType ? {actionType: terms.actionType} : {}
  const selector = {
    selector: {
      ...userId,
      ...actionType,
      createdAt: {$gte: oneWeekAgo}
    }
  }
  return selector
});
ensureIndex(PetrovDayActions, {userId: 1, actionType: 1});


PetrovDayActions.addView("launchDashboard", (terms: PetrovDayActionsViewTerms) => {
  const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

  const actionTypes: PetrovDayActionType[] = terms.side === 'east' ? ['nukeTheWest', 'eastPetrovAllClear', 'eastPetrovNukesIncoming'] : ['nukeTheEast', 'westPetrovAllClear', 'westPetrovNukesIncoming']
  return {
    selector: {
      createdAt: {$gte: oneWeekAgo},
      actionType: {$in: actionTypes},
    }
  };
});

PetrovDayActions.addView("adminConsole", (terms: PetrovDayActionsViewTerms) => {
  const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

  return {
    selector: {
      createdAt: {$gte: oneWeekAgo},
    },
    options: {
      sort: {createdAt: -1}
    }
  };
});

PetrovDayActions.addView("warningConsole", (terms: PetrovDayActionsViewTerms) => {
  const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

  const actionTypes: PetrovDayActionType[] = terms.side === 'east' ? ['eastPetrovAllClear', 'eastPetrovNukesIncoming'] : ['westPetrovAllClear', 'westPetrovNukesIncoming']
  return {
    selector: {
      createdAt: {$gte: oneWeekAgo},
      actionType: {$in: actionTypes},
    }
  };
});



