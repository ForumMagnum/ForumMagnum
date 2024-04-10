import React, { useState, useCallback, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { forumSelect } from '../../lib/forumTypeUtils';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { HybridRecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';

const recentDisucssionFeedComponents = forumSelect({
  LWAF: {
    ThreadComponent: Components.RecentDiscussionThread,
    ShortformComponent: Components.RecentDiscussionThread,
    TagCommentedComponent: Components.RecentDiscussionTag,
    TagRevisionComponent: Components.RecentDiscussionTagRevisionItem,
    SubscribeReminderComponent: Components.RecentDiscussionSubscribeReminder,
    MeetupsPokeComponent: Components.RecentDiscussionMeetupsPoke,
  },
  default: {
    ThreadComponent: Components.EARecentDiscussionThread,
    ShortformComponent: Components.EARecentDiscussionQuickTake,
    TagCommentedComponent: Components.EARecentDiscussionTagCommented,
    TagRevisionComponent: Components.EARecentDiscussionTagRevision,
    SubscribeReminderComponent: Components.RecentDiscussionSubscribeReminder,
    MeetupsPokeComponent: () => null,
  },
});

const RecombeeFeed = ({
  settings,
  commentsLimit, maxAgeHours,
}: {
  settings: HybridRecombeeConfiguration
  commentsLimit?: number,
  maxAgeHours?: number,
}) => {
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  const [showShortformFeed, setShowShortformFeed] = useState(false);
  const refetchRef = useRef<null|(() => void)>(null);
  const currentUser = useCurrentUser();
  const expandAll = currentUser?.noCollapseCommentsFrontpage || expandAllThreads

  useGlobalKeydown(event => {
    const F_Key = 70
    if ((event.metaKey || event.ctrlKey) && event.keyCode === F_Key) {
      setExpandAllThreads(true);
    }
  });


  const {
    SingleColumnSection,
    MixedTypeFeed,
  } = Components;

  const refetch = useCallback(() => {
    if (refetchRef.current)
      refetchRef.current();
  }, [refetchRef]);

  const {
    ThreadComponent,
    ShortformComponent,
    SubscribeReminderComponent,
    MeetupsPokeComponent,
  } = recentDisucssionFeedComponents;

  return (
    <AnalyticsContext pageSectionContext="recombeeFeed">
        <SingleColumnSection>
          <MixedTypeFeed
            firstPageSize={10}
            pageSize={20}
            refetchRef={refetchRef}
            resolverName="RecombeeFeed"
            sortKeyType="String"
            resolverArgs={{ settings: 'JSON' }}
            resolverArgsValues={{ settings }}
            fragmentArgs={{
              commentsLimit: 'Int',
              maxAgeHours: 'Int',
              af: 'Boolean'
              // tagCommentsLimit: 'Int',
            }}
            fragmentArgsValues={{
              commentsLimit,
              maxAgeHours,
              af: false
              // tagCommentsLimit: commentsLimit,
            }}
            renderers={{
              recommendation: {
                fragmentName: "PostsRecentDiscussion",
                render: (post: PostsRecentDiscussion) => (
                  <ThreadComponent
                    post={post}
                    refetch={refetch}
                    comments={post.recentComments}
                    expandAllThreads={expandAll}
                  />
                )
              },
              postCommented: {
                fragmentName: "PostsRecentDiscussion",
                render: (post: PostsRecentDiscussion) => (
                  <ThreadComponent
                    post={post}
                    refetch={refetch}
                    comments={post.recentComments}
                    expandAllThreads={expandAll}
                  />
                )
              },
              shortformCommented: {
                fragmentName: "ShortformRecentDiscussion",
                render: (post: ShortformRecentDiscussion) => (
                  <ShortformComponent
                    post={post}
                    refetch={refetch}
                    comments={post.recentComments}
                    expandAllThreads={expandAll}
                  />
                )
              },
              subscribeReminder: {
                fragmentName: null,
                render: () => <SubscribeReminderComponent />
              },
              meetupsPoke: {
                fragmentName: null,
                render: () => <MeetupsPokeComponent />
              },
            }}
          />
        </SingleColumnSection>
    </AnalyticsContext>
  )
}

const RecombeeFeedComponent = registerComponent('RecombeeFeed', RecombeeFeed, {
  areEqual: "auto",
});

declare global {
  interface ComponentTypes {
    RecombeeFeed: typeof RecombeeFeedComponent,
  }
}
