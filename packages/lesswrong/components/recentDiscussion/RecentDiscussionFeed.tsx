import React, { useState, useCallback, useRef } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import {showSubscribeReminderInFeed} from '../../lib/publicSettings'
import { ObservableQuery } from '@apollo/client';
import RecentDiscussionSubscribeReminder from "./RecentDiscussionSubscribeReminder";
import EARecentDiscussionThread from "./EARecentDiscussionThread";
import EARecentDiscussionTagCommented from "./EARecentDiscussionTagCommented";
import EARecentDiscussionTagRevision from "./EARecentDiscussionTagRevision";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import MixedTypeFeed from "../common/MixedTypeFeed";
import AnalyticsInViewTracker from "../common/AnalyticsInViewTracker";
import EARecentDiscussionNewQuickTake from './EARecentDiscussionNewQuickTake';
import EARecentDiscussionQuickTakeCommented from './EARecentDiscussionQuickTakeCommented';

const RecentDiscussionFeed = ({
  commentsLimit,
  maxAgeHours,
  af,
  title="Recent Discussion",
}: {
  commentsLimit?: number,
  maxAgeHours?: number,
  af?: boolean,
  title?: string,
}) => {
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  const refetchRef = useRef<null|ObservableQuery['refetch']>(null);
  const currentUser = useCurrentUser();
  const expandAll = currentUser?.noCollapseCommentsFrontpage || expandAllThreads

  useGlobalKeydown(event => {
    const F_Key = 70
    if ((event.metaKey || event.ctrlKey) && event.keyCode === F_Key) {
      setExpandAllThreads(true);
    }
  });

  const refetch = useCallback(() => {
    if (refetchRef.current)
      void refetchRef.current();
  }, [refetchRef]);

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
                  <EARecentDiscussionThread
                    post={post}
                    refetch={refetch}
                    comments={post.recentComments}
                    expandAllThreads={expandAll}
                  />
                )
              },
              newQuickTake: {
                fragmentName: "QuickTakesRecentDiscussion",
                render: (quickTake: QuickTakesRecentDiscussion) => (
                  <EARecentDiscussionNewQuickTake
                    quickTake={quickTake}
                    refetch={refetch}
                  />
                ),
              },
              quickTakeCommented: {
                fragmentName: "PostQuickTakesRecentDiscussion",
                render: (post: PostQuickTakesRecentDiscussion) => (
                  <EARecentDiscussionQuickTakeCommented
                    post={post}
                    comments={post.recentQuickTakeComments}
                    expandAllThreads={expandAllThreads}
                    refetch={refetch}
                  />
                )
              },
              tagDiscussed: {
                fragmentName: "TagRecentDiscussion",
                render: (tag: TagRecentDiscussion) => (
                  <EARecentDiscussionTagCommented
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
                  {revision.tag && revision.documentId &&
                    <EARecentDiscussionTagRevision
                      tag={revision.tag}
                      revision={revision}
                      headingStyle="full"
                      documentId={revision.documentId}
                    />
                  }
                </div>,
              },
              ...(showSubscribeReminderInFeed.get() ? {
                subscribeReminder: {
                  fragmentName: null,
                  render: () => <RecentDiscussionSubscribeReminder />,
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
