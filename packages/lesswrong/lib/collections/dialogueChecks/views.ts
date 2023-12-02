import { DialogueChecks } from './collection';

type UserDialogueChecksViewTerms = {
  view: "userDialogueChecks",
  userId?: string
}

type DialogueCohortToResetReciprocityViewTerms = {
  view: 'dialogueCohortToResetReciprocity',
  userIds: string[],
  targetUserIds: string[],
  checked: boolean,
  checkedAt: Date
}

declare global {
  type DialogueChecksViewTerms = 
    ViewTermsBase & (UserDialogueChecksViewTerms | DialogueCohortToResetReciprocityViewTerms)
}

DialogueChecks.addView('userDialogueChecks', (terms: DialogueChecksViewTerms) => {
  return {
    selector: {
        userId: terms.userId,
    },
  };
});

DialogueChecks.addView('dialogueCohortToResetReciprocity', function (terms: DialogueCohortToResetReciprocityViewTerms) {
  return {
    selector: { 
      userId: { $in: terms.userIds },
      targetUserId: { $in: terms.targetUserIds },
      checkedAt: { $gt: terms.date },
      checked: terms.checked
    },
    options: { sort: { createdAt: -1 } }
  };
})
