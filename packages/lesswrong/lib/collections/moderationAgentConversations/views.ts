import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface ModerationAgentConversationsConversationsForTargetViewTerms {
    view: 'conversationsForTarget',
    targetUserId: string,
  }

  type ModerationAgentConversationsViewTerms = Omit<ViewTermsBase, 'view'> & (
    ModerationAgentConversationsConversationsForTargetViewTerms |
    {
      view?: undefined,
      targetUserId?: never,
    }
  )
}

function conversationsForTarget(terms: ModerationAgentConversationsConversationsForTargetViewTerms) {
  return {
    selector: {
      targetUserId: terms.targetUserId,
      deleted: false,
    },
    options: {
      sort: { createdAt: -1 },
    },
  };
}

export const ModerationAgentConversationsViews = new CollectionViewSet('ModerationAgentConversations', {
  conversationsForTarget,
});
