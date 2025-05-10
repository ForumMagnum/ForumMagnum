import React, { useState, useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { isFriendlyUI } from '../../themes/forumTheme';
import { RecentDiscussionThread } from "./RecentDiscussionThread";
import { SingleColumnSection } from "../common/SingleColumnSection";
import { SectionTitle } from "../common/SectionTitle";
import { SectionButton } from "../common/SectionButton";
import { ShortformSubmitForm } from "../shortform/ShortformSubmitForm";
import { Loading } from "../vulcan-core/Loading";
import { AnalyticsInViewTracker } from "../common/AnalyticsInViewTracker";
import { LoadMore } from "../common/LoadMore";

const RecentDiscussionThreadsListInner = ({
  terms, commentsLimit, maxAgeHours, af,
  title="Recent Discussion", shortformButton=true
}: {
  terms: Omit<PostsViewTerms, 'af'>,
  commentsLimit?: number,
  maxAgeHours?: number,
  af?: boolean,
  title?: string,
  shortformButton?: boolean,
}) => {
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  const [showShortformFeed, setShowShortformFeed] = useState(false);
  const currentUser = useCurrentUser();
  
  const { results, loading, loadMore, loadingMore, refetch } = useMulti({
    terms,
    collectionName: "Posts",
    fragmentName: 'PostsRecentDiscussion',
    fetchPolicy: 'cache-and-network',
    enableTotal: false,
    pollInterval: 0,
    extraVariables: {
      commentsLimit: 'Int',
      maxAgeHours: 'Int',
      af: 'Boolean',
    },
    extraVariablesValues: {
      commentsLimit, maxAgeHours, af
    },
  });

  useGlobalKeydown((event: KeyboardEvent) => {
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
  if (!loading && results && !results.length) {
    return null
  }

  const expandAll = currentUser?.noCollapseCommentsFrontpage || expandAllThreads

  // TODO: Probably factor out "RecentDiscussionThreadsList" vs "RecentDiscussionSection", rather than making RecentDiscussionThreadsList cover both and be weirdly customizable
  return (
    <SingleColumnSection>
      <SectionTitle title={title}>
        {currentUser?.isReviewed && shortformButton && !currentUser.allCommentingDisabled && <div onClick={toggleShortformFeed}>
          <SectionButton>
            <AddBoxIcon />
            {"New quick take"}
          </SectionButton>
        </div>}
      </SectionTitle>
      <div>
        {results && <div>
          {results.map((post, i) =>
            <RecentDiscussionThread
              key={post._id}
              post={post}
              refetch={refetch}
              comments={post.recentComments}
              expandAllThreads={expandAll}
            />
          )}
        </div>}
        <AnalyticsInViewTracker eventProps={{inViewType: "loadMoreButton"}}>
            { loadMore && <LoadMore loadMore={loadMore}  /> }
            { (loading || loadingMore) && <Loading />}
        </AnalyticsInViewTracker>
      </div>
    </SingleColumnSection>
  )
}

export const RecentDiscussionThreadsList = registerComponent('RecentDiscussionThreadsList', RecentDiscussionThreadsListInner, {
  areEqual: {
    terms: "deep",
  },
});


