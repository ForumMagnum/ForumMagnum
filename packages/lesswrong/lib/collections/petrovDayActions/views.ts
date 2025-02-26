import { CollectionViewSet } from '../../../lib/views/collectionViewSet';
import type { PetrovDayActionType } from "./schema";

declare global {
  interface PetrovDayActionsViewTerms extends ViewTermsBase {
    userId?: string,
    actionType?: PetrovDayActionType,
    data?: any,
    side?: 'east' | 'west'
  }
}

function getAction(terms: PetrovDayActionsViewTerms) {
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
  return selector;
}

function launchDashboard(terms: PetrovDayActionsViewTerms) {
  const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

  const actionTypes: PetrovDayActionType[] = terms.side === 'east' ? ['nukeTheWest', 'eastPetrovAllClear', 'eastPetrovNukesIncoming'] : ['nukeTheEast', 'westPetrovAllClear', 'westPetrovNukesIncoming']
  return {
    selector: {
      createdAt: {$gte: oneWeekAgo},
      actionType: {$in: actionTypes},
    }
  };
}

function adminConsole(terms: PetrovDayActionsViewTerms) {
  const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

  return {
    selector: {
      createdAt: {$gte: oneWeekAgo},
    },
    options: {
      sort: {createdAt: -1}
    }
  };
}

function warningConsole(terms: PetrovDayActionsViewTerms) {
  const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

  const actionTypes: PetrovDayActionType[] = terms.side === 'east' ? ['eastPetrovAllClear', 'eastPetrovNukesIncoming'] : ['westPetrovAllClear', 'westPetrovNukesIncoming']
  return {
    selector: {
      createdAt: {$gte: oneWeekAgo},
      actionType: {$in: actionTypes},
    }
  };
}

export const PetrovDayActionsViews = new CollectionViewSet('PetrovDayActions', {
  getAction,
  launchDashboard,
  adminConsole,
  warningConsole
});



