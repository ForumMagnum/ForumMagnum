import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

interface NoViewTerms extends ViewTermsBase {
  view: undefined;
}

interface UserDialogueChecksViewTerms extends ViewTermsBase {
  view: 'userDialogueChecks';
  userId: string;
}

interface UserTargetDialogueChecksViewTerms extends ViewTermsBase {
  view: 'userTargetDialogueChecks';
  userId: string;
  targetUserIds: string[];
}

declare global {
  type DialogueChecksViewTerms = 
    | NoViewTerms
    | UserDialogueChecksViewTerms
    | UserTargetDialogueChecksViewTerms;
}

function userDialogueChecks(terms: UserDialogueChecksViewTerms) {
  return {
    selector: {
      userId: terms.userId,
    },
  };
}

function userTargetDialogueChecks(terms: UserTargetDialogueChecksViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      targetUserId: { $in: terms.targetUserIds }
    },
  };
}

export const DialogueChecksViews = new CollectionViewSet('DialogueChecks', {
  userDialogueChecks,
  userTargetDialogueChecks
});
