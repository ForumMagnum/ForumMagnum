import React from 'react';
import FeedItemWrapper from '../FeedItemWrapper';
import UltraFeedThreadItem from '../UltraFeedThreadItem';
import UltraFeedPostItem from '../UltraFeedPostItem';
import UltraFeedSpotlightItem from '../UltraFeedSpotlightItem';
import SuggestedFeedSubscriptions from '../../subscriptions/SuggestedFeedSubscriptions';
import { FeedItemSourceType } from '../ultraFeedTypes';
import type { UltraFeedSettingsType } from '../ultraFeedSettingsTypes';

export function createUltraFeedRenderers({ settings }: { settings: UltraFeedSettingsType }) {
  return {
    feedCommentThread: {
      render: (item: FeedCommentThreadFragment, index: number) => {
        if (!item) return null;
        const thread = {
          ...item,
          postSources: item.postSources as FeedItemSourceType[] | null,
        };
        return (
          <FeedItemWrapper>
            <UltraFeedThreadItem
              thread={thread}
              settings={settings}
              index={index}
            />
          </FeedItemWrapper>
        );
      },
    },
    feedPost: {
      render: (item: FeedPostFragment, index: number) => {
        if (!item) return null;
        return (
          <FeedItemWrapper>
            <UltraFeedPostItem
              post={item.post}
              postMetaInfo={item.postMetaInfo}
              settings={settings}
              index={index}
            />
          </FeedItemWrapper>
        );
      },
    },
    feedSpotlight: {
      render: (item: FeedSpotlightFragment, index: number) => {
        if (!item || !item.spotlight) return null;
        const metaInfo = item.spotlightMetaInfo ? {
          ...item.spotlightMetaInfo,
          sources: item.spotlightMetaInfo.sources as FeedItemSourceType[],
        } : undefined;
        return (
          <FeedItemWrapper>
            <UltraFeedSpotlightItem
              spotlight={item.spotlight}
              post={item.post ?? undefined}
              spotlightMetaInfo={metaInfo}
              showSubtitle={true}
              index={index}
            />
          </FeedItemWrapper>
        );
      },
    },
    feedSubscriptionSuggestions: {
      render: (item: FeedSubscriptionSuggestionsFragment, index: number) => {
        if (!item || !item.suggestedUsers) return null;
        return (
          <FeedItemWrapper>
            <SuggestedFeedSubscriptions
              suggestedUsers={item.suggestedUsers}
            />
          </FeedItemWrapper>
        );
      },
    },
  } as const;
}

