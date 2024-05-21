import { DialogueChecks } from './collection';

interface NoViewTerms extends ViewTermsBase {
  view?: undefined;
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

DialogueChecks.addView('userDialogueChecks', (terms: UserDialogueChecksViewTerms) => {
  return {
    selector: {
      userId: terms.userId,
    },
  };
});

DialogueChecks.addView('userTargetDialogueChecks', (terms: UserTargetDialogueChecksViewTerms) => {
  return {
    selector: {
      userId: terms.userId,
      targetUserId: { $in: terms.targetUserIds }
    },
  };
});
