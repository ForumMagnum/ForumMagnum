import React, { useState, useCallback, useRef } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { forumSelect } from '../../lib/forumTypeUtils';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox'
import { isLWorAF } from '../../lib/instanceSettings';
import {showSubscribeReminderInFeed} from '../../lib/publicSettings'
import { ObservableQuery } from '@apollo/client';
import RecentDiscussionThread from "./RecentDiscussionThread";
import RecentDiscussionTag from "./RecentDiscussionTag";
import RecentDiscussionTagRevisionItem from "./RecentDiscussionTagRevisionItem";
import RecentDiscussionSubscribeReminder from "./RecentDiscussionSubscribeReminder";
import RecentDiscussionMeetupsPoke from "./RecentDiscussionMeetupsPoke";
import EARecentDiscussionThread from "./EARecentDiscussionThread";
import EARecentDiscussionQuickTake from "./EARecentDiscussionQuickTake";
import EARecentDiscussionTagCommented from "./EARecentDiscussionTagCommented";
import EARecentDiscussionTagRevision from "./EARecentDiscussionTagRevision";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import MixedTypeFeed from "../common/MixedTypeFeed";
import AnalyticsInViewTracker from "../common/AnalyticsInViewTracker";

const recentDisucssionFeedComponents = () => forumSelect({
  LWAF: {
    ThreadComponent: RecentDiscussionThread,
    ShortformComponent: RecentDiscussionThread,
    TagCommentedComponent: RecentDiscussionTag,
    TagRevisionComponent: RecentDiscussionTagRevisionItem,
    SubscribeReminderComponent: RecentDiscussionSubscribeReminder,
    MeetupsPokeComponent: RecentDiscussionMeetupsPoke,
  },
  default: {
    ThreadComponent: EARecentDiscussionThread,
    ShortformComponent: EARecentDiscussionQuickTake,
    TagCommentedComponent: EARecentDiscussionTagCommented,
    TagRevisionComponent: EARecentDiscussionTagRevision,
    SubscribeReminderComponent: RecentDiscussionSubscribeReminder,
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
          <SectionTitle title={title} large />
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
                  {revision.tag && revision.documentId && <TagRevisionComponent
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

export default registerComponent('RecentDiscussionFeed', RecentDiscussionFeed, {
  areEqual: "auto",
});


