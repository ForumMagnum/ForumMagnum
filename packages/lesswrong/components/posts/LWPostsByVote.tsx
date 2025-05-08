import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  checkboxRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: 24
  }
})

const LWPostsByVoteInner = ({classes, postIds, year, limit, showMostValuableCheckbox=false, hideEmptyStateText=false, postItemClassName}: {
  classes: ClassesType<typeof styles>,
  postIds: Array<string>,
  year: number | '≤2020',
  limit?: number,
  showMostValuableCheckbox?: boolean,
  hideEmptyStateText?: boolean,
  postItemClassName?: string,
}) => {
  const { PostsItem, ErrorBoundary, Loading, Typography, LoadMore, SectionFooterCheckbox, LWTooltip } = Components
  const [requiredUnnominated, setRequiredUnnominated] = useState(true)
  const [requiredFrontpage, setRequiredFrontpage] = useState(true)

  const before = year === '≤2020' ? '2021-01-01' : `${year + 1}-01-01`
  const after = `${year}-01-01`

  const { results: posts, loading, showLoadMore, loadMoreProps } = useMulti({
    terms: {
      view: "nominatablePostsByVote",
      postIds,
      requiredUnnominated,
      requiredFrontpage,
      before,
      ...(year === '≤2020' ? {} : {after}),
    },
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
    limit: limit ?? 1000,
  })

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

export const LWPostsByVote = registerComponent("LWPostsByVote", LWPostsByVoteInner, {styles});

declare global {
  interface ComponentTypes {
    LWPostsByVote: typeof LWPostsByVote
  }
}
