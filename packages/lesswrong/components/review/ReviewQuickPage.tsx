import { useMutation, gql } from '@apollo/client';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import { getReviewPhase, REVIEW_YEAR } from '../../lib/reviewUtils';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { userIsAdmin } from '../../lib/vulcan-users';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';

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
  instructions: {
    padding: 16,
    marginBottom: 24,
    ...commentBodyStyles(theme),
    background: theme.palette.panelBackground.default,
    boxShadow: theme.palette.boxShadow.default,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  rightColumn: {
    gridArea: "rightColumn",
    [theme.breakpoints.down('sm')]: {
      gridArea: "unset"
    },
  },
  faded: {
    opacity: .25
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
});

export const ReviewQuickPage = ({classes}: {
  classes: ClassesType,
}) => {
  const reviewPhase = getReviewPhase()
  const reviewYear = REVIEW_YEAR
  const [expandedPost, setExpandedPost] = useState<PostsListWithVotes|null>(null)

  const currentUser = useCurrentUser()

  const { results: posts, loadMoreProps } = useMulti({
    terms: {
      view: "reviewQuickPage",
      before: `${reviewYear+1}-01-01`,
      after: `${reviewYear}-01-01`,
      limit: 12,
    },
    collectionName: "Posts",
    fragmentName: 'PostsReviewVotingList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
    itemsPerPage: 1000,
    skip: !reviewYear
  });

  const { totalCount } = useMulti({
    terms: {
      view: "reviews",
      userId: currentUser?._id,
      reviewYear
    },
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: true,
    skip: !currentUser,
    limit: 0
  });

  // useMulti is incorrectly typed
  const postsResults = posts as PostsListWithVotes[] | null;

  const { PostsItem2, ReviewVotingExpandedPost, FrontpageReviewWidget, SectionFooter, LoadMore, Row, LWTooltip } = Components
  
  const yourReviewsMessage = totalCount ? `You've written ${totalCount} reviews.` : "You haven't written any reviews yet."

  return <div className={classes.grid}>
    <div className={classes.leftColumn}>
      {!expandedPost && <div>
        <FrontpageReviewWidget showFrontpageItems={false} reviewYear={reviewYear}/>
        <div className={classes.instructions}>
          <b>Posts need at least 1 review to enter the Final Voting Phase</b>
          <p>In the right-column are posts which were upvoted during the Nomination Voting Phase, but which haven't gotten a review yet. Write reviews for any posts which you benefited from, or you think you might have something informative to say about.</p>
          <p><b>Review 3 posts, you have done your civic duty.</b></p>
          <p>Let's be real, there's a hella lotta posts you could review. But if you review three posts, you can call it a day and bask in the warm glow of knowing you helped LessWrong reflect upon itself, improving our longterm reward signal.</p>
          <p>({yourReviewsMessage})</p>
          <p><b>Review Prizes</b></p>
          <p>It's fine to write quick reviews that simply describe a time a post was useful to you. But the LessWrong team awards a $50 prize for each review that offers at least some substantive information, and $100-$500 for high effort reviews that engage deeply with a post's factual claims, arguments or broader implications.</p>
        </div>
        <SectionFooter>
          {userIsAdmin(currentUser) && <LWTooltip title={`Look at metrics related to the Review`}>
            <Link to={`/reviewAdmin/${reviewYear}`} className={classNames(classes.actionButton, classes.adminButton)}>
              Review Admin
            </Link>
          </LWTooltip>}
          <LWTooltip title={`Look over your upvotes from ${reviewYear}. (This is most useful during the nomination phase, but you may still enjoy looking them over in the latter phases to help compare)`}>
            <Link to={`/votesByYear/${reviewYear}`}>
              Your {reviewYear} Upvotes
            </Link>
          </LWTooltip>
          <LWTooltip title="Look at reviews, update your votes, and see more detailed info from the Nomination Vote results">
           <Link to={`/reviewVoting/${reviewYear}`}>
              Advanced Dashboard
            </Link>
          </LWTooltip>
        </SectionFooter>
      </div>}
      {expandedPost && <ReviewVotingExpandedPost
        post={expandedPost}
        setExpandedPost={setExpandedPost}
      />}
    </div>
    <div className={classNames(classes.rightColumn, {[classes.faded]: !!expandedPost})}>
      <div className={classes.menu}>
        Top Unreviewed Posts
      </div>
      {postsResults?.map(post => {
        return <div key={post._id} onClick={() => setExpandedPost(post)}>
          <PostsItem2 
            post={post} 
            showKarma={false}
            showPostedAt={false}
          />
        </div>
      })}
      <SectionFooter>
        <LoadMore {...loadMoreProps} sectionFooterStyles/>
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

