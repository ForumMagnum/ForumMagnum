import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import PostsItem from "./PostsItem";
import ErrorBoundary from "../common/ErrorBoundary";
import Loading from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import LoadMore from "../common/LoadMore";
import SectionFooterCheckbox from "../form-components/SectionFooterCheckbox";
import LWTooltip from "../common/LWTooltip";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostsListWithVotesMultiQuery = gql(`
  query multiPostLWPostsByVoteQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  checkboxRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: 24
  }
})

const LWPostsByVote = ({classes, postIds, year, limit, showMostValuableCheckbox=false, hideEmptyStateText=false, postItemClassName}: {
  classes: ClassesType<typeof styles>,
  postIds: Array<string>,
  year: number | '≤2020',
  limit?: number,
  showMostValuableCheckbox?: boolean,
  hideEmptyStateText?: boolean,
  postItemClassName?: string,
}) => {
  const [requiredUnnominated, setRequiredUnnominated] = useState(true)
  const [requiredFrontpage, setRequiredFrontpage] = useState(true)

  const before = year === '≤2020' ? '2021-01-01' : `${year + 1}-01-01`
  const after = `${year}-01-01`

  const { data, loading, loadMoreProps } = useQueryWithLoadMore(PostsListWithVotesMultiQuery, {
    variables: {
      selector: { nominatablePostsByVote: { postIds, requiredUnnominated, requiredFrontpage, before, ...(year === '≤2020' ? {} : { after }) } },
      limit: limit ?? 1000,
      enableTotal: false,
    },
  });

  const posts = data?.posts?.results;

  const showLoadMore = !loadMoreProps.hidden;

  if (loading && !posts) return <div><Loading/> <Typography variant="body2">Loading Posts</Typography></div>

  if (!posts || posts.length === 0) {
    return hideEmptyStateText ? null : <Typography variant="body2">You have no upvotes from this period</Typography>
  }

  return <ErrorBoundary>
    <div>
      <div className={classes.checkboxRow}>
        <LWTooltip title="Only show posts that don't have 2+ nomination votes yet.">
          <SectionFooterCheckbox value={requiredUnnominated} onClick={() => setRequiredUnnominated(!requiredUnnominated)} label="Required unnominated" />
        </LWTooltip>
        <LWTooltip title="Only show frontpage posts (frontpage posts filtered for 'timelessness').">
          <SectionFooterCheckbox value={requiredFrontpage} onClick={() => setRequiredFrontpage(!requiredFrontpage)} label="Required frontpage" />
        </LWTooltip>
      </div>
      {posts.map(post => {
        return <PostsItem key={post._id} post={post} showMostValuableCheckbox={showMostValuableCheckbox} className={postItemClassName} />
      })}
      {showLoadMore && <LoadMore {...loadMoreProps} />}
    </div>
  </ErrorBoundary>
}

export default registerComponent("LWPostsByVote", LWPostsByVote, {styles});


