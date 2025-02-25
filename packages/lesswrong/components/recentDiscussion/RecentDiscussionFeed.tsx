import React, { useState, useCallback, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { forumSelect } from '../../lib/forumTypeUtils';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import AddBoxIcon from '@material-ui/icons/AddBox'
import { isLWorAF } from '../../lib/instanceSettings';
import {showSubscribeReminderInFeed} from '../../lib/publicSettings'
import { ObservableQuery } from '@apollo/client';

const recentDisucssionFeedComponents = () => forumSelect({
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

const RecentDiscussionFeed = ({
  commentsLimit, maxAgeHours, af,
  title="Recent Discussion", shortformButton=true
}: {
  commentsLimit?: number,
  maxAgeHours?: number,
  af?: boolean,
  title?: string,
  shortformButton?: boolean,
}) => {
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  const [showShortformFeed, setShowShortformFeed] = useState(false);
  const refetchRef = useRef<null|ObservableQuery['refetch']>(null);
  const currentUser = useCurrentUser();
  const expandAll = currentUser?.noCollapseCommentsFrontpage || expandAllThreads

  useGlobalKeydown(event => {
    const F_Key = 70
    if ((event.metaKey || event.ctrlKey) && event.keyCode === F_Key) {
      setExpandAllThreads(true);
    }
  });

  const toggleShortformFeed = useCallback(
    () => {
      setShowShortformFeed(!showShortformFeed);
    },
    [setShowShortformFeed, showShortformFeed]
  );

  const {
    SingleColumnSection,
    SectionTitle,
    MixedTypeFeed,
    AnalyticsInViewTracker,
  } = Components;

  const refetch = useCallback(() => {
    if (refetchRef.current)
      void refetchRef.current();
  }, [refetchRef]);

  const {
    ThreadComponent,
    ShortformComponent,
    TagCommentedComponent,
    TagRevisionComponent,
    SubscribeReminderComponent,
    MeetupsPokeComponent,
  } = recentDisucssionFeedComponents();

  return (
    <AnalyticsContext pageSectionContext="recentDiscussion">
      <AnalyticsInViewTracker eventProps={{inViewType: "recentDiscussion"}}>
        <SingleColumnSection>
          <SectionTitle title={title} />
          <MixedTypeFeed
            firstPageSize={10}
            pageSize={20}
            refetchRef={refetchRef}
            resolverName="RecentDiscussionFeed"
            sortKeyType="Date"
            resolverArgs={{ af: 'Boolean' }}
            resolverArgsValues={{ af }}
            fragmentArgs={{
              commentsLimit: 'Int',
              maxAgeHours: 'Int',
              tagCommentsLimit: 'Int',
            }}
            fragmentArgsValues={{
              commentsLimit, maxAgeHours,
              tagCommentsLimit: commentsLimit,
            }}
            renderers={{
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
              tagDiscussed: {
                fragmentName: "TagRecentDiscussion",
                render: (tag: TagRecentDiscussion) => (
                  <TagCommentedComponent
                    tag={tag}
                    refetch={refetch}
                    comments={tag.recentComments}
                    expandAllThreads={expandAll}
                  />
                )
              },
              tagRevised: {
                fragmentName: "RecentDiscussionRevisionTagFragment",
                render: (revision: RecentDiscussionRevisionTagFragment) => <div>
                  {revision.tag && <TagRevisionComponent
                    tag={revision.tag}
                    revision={revision}
                    headingStyle="full"
                    documentId={revision.documentId}
                  />}
                </div>,
              },
              meetupsPoke: {
                fragmentName: null,
                render: () => <MeetupsPokeComponent />
              },
              ...(showSubscribeReminderInFeed.get() ? {
                subscribeReminder: {
                  fragmentName: null,
                  render: () => <SubscribeReminderComponent/>,
                },
              } : {}),
            }}
          />
        </SingleColumnSection>
      </AnalyticsInViewTracker>
    </AnalyticsContext>
  )
}

const RecentDiscussionFeedComponent = registerComponent('RecentDiscussionFeed', RecentDiscussionFeed, {
  areEqual: "auto",
});

declare global {
  interface ComponentTypes {
    RecentDiscussionFeed: typeof RecentDiscussionFeedComponent,
  }
}
