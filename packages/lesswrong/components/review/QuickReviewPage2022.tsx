import React, { useState } from 'react';
import { getReviewPhase, REVIEW_YEAR } from '../../lib/reviewUtils';
import { registerComponent } from '../../lib/vulcan-lib/components';
import sortBy from 'lodash/sortBy';
import { preferredHeadingCase } from '../../themes/forumTheme';
import PostsItem from "../posts/PostsItem";
import ReviewVotingExpandedPost from "./ReviewVotingExpandedPost";
import FrontpageReviewWidget from "./FrontpageReviewWidget";
import SectionFooter from "../common/SectionFooter";
import Loading from "../vulcan-core/Loading";
import ReviewPhaseInformation from "./ReviewPhaseInformation";
import ReviewDashboardButtons from "./ReviewDashboardButtons";
import PostInteractionStripe from "./PostInteractionStripe";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostsReviewVotingListMultiQuery = gql(`
  query multiPostQuickReviewPage2022Query($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsReviewVotingList
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: `
      minmax(10px, 0.5fr) minmax(100px, 740px) minmax(30px, 0.5fr) minmax(300px, 740px) minmax(30px, 0.5fr)
    `,
    gridTemplateAreas: `
    "... leftColumn ... rightColumn ..."
    `,
    paddingBottom: 175,
    alignItems: "start",
    [theme.breakpoints.down('sm')]: {
      display: "block"
    }
  },
  leftColumn: {
    gridArea: "leftColumn",
    position: "sticky",
    top: 72,
    paddingLeft: 24,
    paddingRight: 36,
    [theme.breakpoints.down('sm')]: {
      gridArea: "unset",
      paddingLeft: 0,
      paddingRight: 0,
      overflow: "unset",
      height: "unset",
      position: "unset"
    }
  },
  rightColumn: {
    gridArea: "rightColumn",
    [theme.breakpoints.down('sm')]: {
      gridArea: "unset"
    },
  },
  root: {
    display: "flex"
  },
  menu: {
    position: "sticky",
    top:0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...theme.typography.body2,
    backgroundColor: theme.palette.panelBackground.default,
    zIndex: theme.zIndexes.reviewVotingMenu,
    padding: 10,
    marginBottom: 2,
    // background: theme.palette.grey[310],
    flexWrap: "wrap"
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

export const QuickReviewPage2022 = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const reviewYear = REVIEW_YEAR
  const [expandedPost, setExpandedPost] = useState<PostsReviewVotingList|null>(null)
  const [truncatePosts, setTruncatePosts] = useState<boolean>(true)

  const { data, loading, loadMoreProps: { loadMore } } = useQueryWithLoadMore(PostsReviewVotingListMultiQuery, {
    variables: {
      selector: { reviewQuickPage: { before: `${reviewYear + 1}-01-01`, after: `${reviewYear}-01-01` } },
      limit: 25,
      enableTotal: true,
    },
    skip: !reviewYear,
    fetchPolicy: 'cache-and-network',
    itemsPerPage: 1000,
  });

  const posts = data?.posts?.results;
  const totalCount = data?.posts?.totalCount;
  const sortedPostsResults = !!posts ? sortBy(posts, (post1,post2) => {
    return post1.currentUserVote === null
  }) : []

  const truncatedPostsResults = truncatePosts ? sortedPostsResults.slice(0,12) : sortedPostsResults

  const handleLoadMore = () => {
    if (truncatePosts) {
      setTruncatePosts(false)
    } else {
      void loadMore()
    }
  }

  const loadMoreText = preferredHeadingCase("Load More");

  return <div className={classes.grid}>
    <div className={classes.leftColumn}>
      {!expandedPost && <div>
        <FrontpageReviewWidget showFrontpageItems={false} reviewYear={reviewYear}/>
        <ReviewPhaseInformation reviewYear={reviewYear} reviewPhase={"REVIEWS"}/>
        <ReviewDashboardButtons 
          reviewYear={reviewYear} 
          reviewPhase={getReviewPhase()}
          showAdvancedDashboard
        />
      </div>}
      {expandedPost && <ReviewVotingExpandedPost
        post={expandedPost}
        setExpandedPost={setExpandedPost}
      />}
    </div>
    <div className={classes.rightColumn}>
      <div className={classes.menu}>
        Top Unreviewed Posts
      </div>
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
  </div>;
}

export default registerComponent('QuickReviewPage2022', QuickReviewPage2022, {styles});


