import React, { useState } from 'react';
import { getReviewPhase, REVIEW_YEAR, ReviewYear } from '../../lib/reviewUtils';
import { registerComponent } from '../../lib/vulcan-lib/components';
import sortBy from 'lodash/sortBy';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { getVotePower } from '@/lib/voting/vote';
import { useCurrentUser } from '../common/withUser';
import PostsItem from "../posts/PostsItem";
import SectionFooter from "../common/SectionFooter";
import Loading from "../vulcan-core/Loading";
import PostInteractionStripe from "./PostInteractionStripe";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

const PostsReviewVotingListMultiQuery = gql(`
  query multiPostQuickReviewPageQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsReviewVotingList
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: { 
    marginBottom: -20
  },
  sortingOptions: {
    whiteSpace: "pre",
    display: "flex",
    [theme.breakpoints.down('xs')]: {
      paddingTop: 12,
      paddingLeft: 4
    }
  },
  reviewProgressBar: {
    marginRight: "auto"
  },
  postRoot: {
    position: "relative",
    paddingLeft: 6,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    borderBottomWidth: 2,
    borderBottom: theme.palette.border.itemSeparatorBottom,
  },
  loading: {
    opacity: .5
  },  
  loadMore: {
    ...theme.typography.body2,
    color: theme.palette.primary.main,
    marginRight: "auto"
  }
});

export const QuickReviewPage = ({classes, reviewYear}: {
  classes: ClassesType<typeof styles>,
  reviewYear: ReviewYear
}) => {
  const [expandedPost, setExpandedPost] = useState<PostsReviewVotingList|null>(null)
  const [truncatePosts, setTruncatePosts] = useState<boolean>(true)
  const currentUser = useCurrentUser()

  const { data, loading, loadMoreProps: { loadMore } } = useQueryWithLoadMore(PostsReviewVotingListMultiQuery, {
    variables: {
      selector: { reviewQuickPage: { before: `${reviewYear + 1}-01-01`, after: `${reviewYear}-01-01` } },
      limit: 60,
      enableTotal: true,
    },
    skip: !reviewYear,
    fetchPolicy: 'cache-and-network',
    itemsPerPage: 1000,
  });

  const posts = data?.posts?.results;
  const totalCount = data?.posts?.totalCount;

  function comparePosts(post1: PostsReviewVotingList, post2: PostsReviewVotingList) {
    const post1QuadraticScore = post1.currentUserReviewVote?.quadraticScore ?? 0
    const post2QuadraticScore = post2.currentUserReviewVote?.quadraticScore ?? 0
    const post1KarmaVote = post1.currentUserVote
      ? getVotePower({ user: currentUser!, voteType: post1.currentUserVote, document: post1 })
      : 0;
    const post2KarmaVote = post2.currentUserVote
      ? getVotePower({ user: currentUser!, voteType: post2.currentUserVote, document: post2 })
      : 0;
    const post1ReadStatus = post1.lastVisitedAt ? 1 : 0
    const post2ReadStatus = post2.lastVisitedAt ? 1 : 0

    if (post2ReadStatus - post1ReadStatus) {
        return post2ReadStatus - post1ReadStatus;
    }
    if (post2KarmaVote - post1KarmaVote) {
        return post2KarmaVote - post1KarmaVote;
    }
    if (post2QuadraticScore - post1QuadraticScore) {
        return post2QuadraticScore - post1QuadraticScore;
    }
    return post2.baseScore - post1.baseScore;
  }

  const sortedPostsResults = !!posts ? [...posts].sort(comparePosts) : []

  const truncatedPostsResults = truncatePosts ? sortedPostsResults.slice(0,12) : sortedPostsResults

  const handleLoadMore = () => {
    if (truncatePosts) {
      setTruncatePosts(false)
    } else {
      void loadMore()
    }
  }

  const loadMoreText = preferredHeadingCase("Load More");

  return <div className={classes.root}>
      <div className={loading ? classes.loading : undefined}>
        {truncatedPostsResults.map(post => {
          return <div key={post._id} onClick={() => setExpandedPost(post)} className={classes.postRoot}>
            <PostsItem 
              post={post} 
              showKarma={false}
              showPostedAt={false}
            />
            <PostInteractionStripe post={post}/>
          </div>
        })}
      </div>
      <SectionFooter>
        <div className={classes.loadMore}>
          {loading && <Loading/>}
          <a onClick={() => handleLoadMore()}>{loadMoreText} ({truncatedPostsResults.length}/{totalCount})</a>
        </div>
      </SectionFooter>
    </div>
}

export default registerComponent('QuickReviewPage', QuickReviewPage, {styles});


