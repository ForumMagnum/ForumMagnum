import React, { useState, useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { isFriendlyUI } from '../../themes/forumTheme';
import RecentDiscussionThread from "./RecentDiscussionThread";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import SectionButton from "../common/SectionButton";
import ShortformSubmitForm from "../shortform/ShortformSubmitForm";
import Loading from "../vulcan-core/Loading";
import AnalyticsInViewTracker from "../common/AnalyticsInViewTracker";
import LoadMore from "../common/LoadMore";
import { NetworkStatus } from "@apollo/client";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostsRecentDiscussionMultiQuery = gql(`
  query multiPostRecentDiscussionThreadsListQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean, $commentsLimit: Int, $maxAgeHours: Int, $af: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsRecentDiscussion
      }
      totalCount
    }
  }
`);

const RecentDiscussionThreadsList = ({
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
  
  const { view, limit, ...selectorTerms } = terms;
  const { data, loading, refetch, networkStatus, loadMoreProps } = useQueryWithLoadMore(PostsRecentDiscussionMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 10,
      enableTotal: false,
      ...{
        commentsLimit, maxAgeHours, af
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  const results = data?.posts?.results;
  const { loadMore } = loadMoreProps;
  const loadingMore = networkStatus === NetworkStatus.fetchMore;

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
              comments={post.recentComments ?? undefined}
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

export default registerComponent('RecentDiscussionThreadsList', RecentDiscussionThreadsList, {
  areEqual: {
    terms: "deep",
  },
});


