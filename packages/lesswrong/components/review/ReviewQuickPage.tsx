import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { getReviewPhase, REVIEW_YEAR } from '../../lib/reviewUtils';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import sortBy from 'lodash/sortBy';
import { preferredHeadingCase } from '../../lib/forumTypeUtils';

const styles = (theme: ThemeType): JssStyles => ({
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

export const ReviewQuickPage = ({classes}: {
  classes: ClassesType,
}) => {
  const reviewYear = REVIEW_YEAR
  const [expandedPost, setExpandedPost] = useState<PostsListWithVotes|null>(null)
  const [truncatePosts, setTruncatePosts] = useState<boolean>(true)

  const { results: posts, loadMore, loading, totalCount } = useMulti({
    terms: {
      view: "reviewQuickPage",
      before: `${reviewYear+1}-01-01`,
      after: `${reviewYear}-01-01`,
      limit: 25,
    },
    collectionName: "Posts",
    fragmentName: 'PostsReviewVotingList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
    itemsPerPage: 1000,
    skip: !reviewYear
  });

  // useMulti is incorrectly typed
  const postsResults = posts as PostsListWithVotes[] | null;

  const { PostsItem, ReviewVotingExpandedPost, FrontpageReviewWidget, SectionFooter, Loading, ReviewPhaseInformation, ReviewDashboardButtons, KarmaVoteStripe } = Components

  const sortedPostsResults = !!postsResults ? sortBy(posts, (post1,post2) => {
    return post1.currentUserVote === null
  }) as PostsListWithVotes[] : []

  const truncatedPostsResults = truncatePosts ? sortedPostsResults.slice(0,12) : sortedPostsResults

  const handleLoadMore = () => {
    if (truncatePosts) {
      setTruncatePosts(false)
    } else {
      loadMore()
    }
  }

  const loadMoreText = `<a>(${preferredHeadingCase("Load More")})</a>`;

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
        showReviewButton={false}
        post={expandedPost}
        setExpandedPost={setExpandedPost}
      />}
    </div>
    <div className={classes.rightColumn}>
      <div className={classes.menu}>
        Top Unreviewed Posts
      </div>
      <div className={loading ? classes.loading : null}>
        {truncatedPostsResults.map(post => {
          return <div key={post._id} onClick={() => setExpandedPost(post)} className={classes.postRoot}>
            <PostsItem 
              post={post} 
              showKarma={false}
              showPostedAt={false}
            />
            <KarmaVoteStripe post={post}/>
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

const ReviewQuickPageComponent = registerComponent('ReviewQuickPage', ReviewQuickPage, {styles});

declare global {
  interface ComponentTypes {
    ReviewQuickPage: typeof ReviewQuickPageComponent
  }
}

