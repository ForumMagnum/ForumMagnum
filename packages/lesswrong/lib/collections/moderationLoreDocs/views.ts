import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface ModerationLoreDocsGlobalLoreViewTerms {
    view: 'globalLore',
  }

  interface ModerationLoreDocsLoreForUserViewTerms {
    view: 'loreForUser',
    targetUserId: string,
  }

  type ModerationLoreDocsViewTerms = Omit<ViewTermsBase, 'view'> & (
    ModerationLoreDocsGlobalLoreViewTerms |
    ModerationLoreDocsLoreForUserViewTerms |
    {
      view?: undefined,
      targetUserId?: never,
    }
  )
}

function globalLore(_terms: ModerationLoreDocsGlobalLoreViewTerms) {
  return {
    selector: {
      scope: 'global',
      deleted: false,
    },
    options: {
      sort: { createdAt: 1 },
    },
  };
}

function loreForUser(terms: ModerationLoreDocsLoreForUserViewTerms) {
  return {
    selector: {
      scope: 'user',
      targetUserId: terms.targetUserId,
      deleted: false,
    },
    options: {
      sort: { createdAt: 1 },
    },
  };
}

export const ModerationLoreDocsViews = new CollectionViewSet('ModerationLoreDocs', {
  globalLore,
  loreForUser,
});
