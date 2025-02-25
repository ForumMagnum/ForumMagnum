import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import type { SyntheticQualitativeVote } from './ReviewVotingPage';
import { postGetCommentCount } from "../../lib/collections/posts/helpers";
import { eligibleToNominate, getCostData, ReviewPhase, ReviewYear } from '../../lib/reviewUtils';
import { voteTextStyling } from './PostsItemReviewVote';
import { useRecordPostView } from '../hooks/useRecordPostView';
import { commentBodyStyles } from '../../themes/stylePiping';
import { usePostsItem } from '../posts/usePostsItem';

const styles = (theme: ThemeType) => ({
  root: {
    borderBottom: theme.palette.border.slightlyFaint,
    position: "relative",
    background: theme.palette.panelBackground.default,
    [theme.breakpoints.down('xs')]: {
      marginBottom: 2,
      boxShadow: theme.palette.boxShadow.default,
    },
    '&:hover': {
      '& $expandPostButton': {
        opacity: .5
      }
    }
  },
  votingPhase: {
    marginTop: 20,
    border: theme.palette.border.faint,
    boxShadow: `0 1px 3px 0px ${theme.palette.boxShadowColor(.05)}`
  },
  voteIcon: {
    padding: 0
  },
  count: {
    width: 30,
    textAlign: "center",
    marginRight: 8
  },
  postVote: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      flexWrap: "wrap",
    }
  },
  postVoteVotingPhase: {
    flexWrap: "wrap",
  },
  post: {
    paddingLeft: 16,
    paddingBottom: 8,
    paddingTop: 10,
    paddingRight: 18,
    maxWidth: "calc(100% - 240px)",
    marginRight: "auto",
    [theme.breakpoints.down('xs')]: {
      maxWidth: "calc(100% - 100px)",
      background: theme.palette.panelBackground.default,
    }
  },
  postVotingPhase: {
    width: "100%",
    maxWidth: "calc(100% - 50px)",
  },
  reviews: {
    width: "100%",
    position: "relative",
    left: -6
  },
  highlight: {
    padding: 16,
    background: theme.palette.grey[55],
    borderTop: theme.palette.border.faint,
  },
  expandIcon: {
    color: theme.palette.grey[500],
    width: 36,
  },
  votes: {
    backgroundColor: theme.palette.grey[200],
    padding: 10,
    alignSelf: "stretch",
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      padding: 7,
      width: "100%",
      textAlign: "center",
    }
  },
  votesVotingPhase: {
    backgroundColor: "unset",
    marginLeft: "auto",
    [theme.breakpoints.down('xs')]: {
      width: "unset",
    }
  },
  yourVote: {
    marginLeft: 6,
    [theme.breakpoints.down('xs')]: {
      order: 0,
      marginRight: 10
    }
  },
  voteResults: {
    width: 140,
    ...theme.typography.commentStyle,
    fontSize: 12,
    [theme.breakpoints.down('xs')]: {
      order: 1,
      width: "100%",
      marginLeft: "auto"
    }
  },
  reviewVote: {
    color: theme.palette.text.slightlyDim,
    display: "inline-block",
    fontWeight: 500,
    padding: 2,
    marginRight: 3,
    cursor: "pointer"
  },
  disabledVote: {
    ...voteTextStyling(theme),
    color: theme.palette.grey[500],
    cursor: "default"
  },
  commentsCount: {
    marginRight: 8
  },
  cantVote: {
    width: 188,
    textAlign: "center"
  },
  oldVote: {
    border: theme.palette.border.grey300,
    width: 30,
    display: "inline-block",
    textAlign: "center",
    ...commentBodyStyles(theme),
    fontSize: "1rem"
  },
  author: {
    ...theme.typography.commentStyle,
    fontSize: "1rem",
    color: theme.palette.grey[500],
  },
  postIndex: {
    width: 30,
    textAlign: "center",
    paddingLeft: 6,
    ...theme.typography.body2,
    color: theme.palette.grey[500],
    fontSize: 12,
    flexShrink: 0,
    position: "absolute",
    left: -35,
    cursor: "pointer",
    [theme.breakpoints.down('sm')]: {
      display: "none",
    },
  },
  top50: {
    color: theme.palette.grey[900],
  },
  expandPostButtonContainer: {
    position: "absolute",
    left: -50,
    top: 0,
    height: "100%",
    width: 30,
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    zIndex: theme.zIndexes.reviewExpandButton,
    [theme.breakpoints.down('sm')]: {
      display: "none",
    },
  },
  expandPostButton: {
    fontSize: 20,
    height: "100%",
    width: "100%",
    opacity: 0,
  },
  expanded: {
    opacity: 1,
  },
  newCommentsSection: {
    marginLeft: 16
  }
});

export type voteTooltipType = 'Showing votes by 1000+ Karma LessWrong users'|'Showing all votes'|'Showing votes from Alignment Forum members'

const hasUnreadComments = (visitedDate: Date|null, lastCommentedAt: Date | null) => {
  if (!lastCommentedAt) return false
  if (!visitedDate) return true
  return visitedDate < lastCommentedAt
}

const ReviewVoteTableRow = ({ post, index, dispatch, costTotal, classes, expandedPostId, handleSetExpandedPost, currentVote, showKarmaVotes, reviewPhase, reviewYear, voteTooltip }: {
  post: PostsReviewVotingList,
  index: number,
  costTotal?: number,
  dispatch: React.Dispatch<SyntheticQualitativeVote>,
  showKarmaVotes: boolean,
  classes: ClassesType<typeof styles>,
  expandedPostId?: string|null,
  handleSetExpandedPost: (post: PostsReviewVotingList, openReviewBox?: boolean) => void,
  currentVote: SyntheticQualitativeVote|null,
  reviewPhase: ReviewPhase,
  reviewYear: ReviewYear,
  voteTooltip: voteTooltipType
}) => {
  const {
    PostsTitle, LWTooltip, PostsTooltip, MetaInfo, ReviewVotingButtons,
    PostsItemComments, PostsItem2MetaInfo, PostsItemReviewVote,
    ReviewPostComments, PostInteractionStripe, UsersNameDisplay, ForumIcon,
    PostsItemNewCommentsWrapper
  } = Components

  const currentUser = useCurrentUser()

  const [markedVisitedAt, setMarkedVisitedAt] = useState<Date|null>(null);
  const { recordPostView } = useRecordPostView(post);
  const markAsRead = () => {
    void recordPostView({post, extraEventProperties: {type: "markAsRead"}})
    setMarkedVisitedAt(new Date()) 
  }

  const { commentTerms } = usePostsItem({post})

  const expanded = expandedPostId === post._id

  const currentUserIsAuthor = currentUser && (post.userId === currentUser._id || post.coauthors?.map(author => author?._id).includes(currentUser._id))

  const allVotes = post.reviewVotesAllKarma || []

  let positiveVoteCountText = "0"
  let positiveVoteCountTooltip = "0 positive votes"
  if (post.positiveReviewVoteCount === 1) {
    positiveVoteCountText = "1"
    positiveVoteCountTooltip = "1 positive vote"
  }
  if (post.positiveReviewVoteCount > 1) {
    positiveVoteCountText = "2+"
    positiveVoteCountTooltip = "2 or more positive votes"
  }

  // get the user's review vote. Use the quadraticScore if it exists (used in 2018 and 2019), 
  // otherwise use the qualitative score display. 
  const qualitativeScore = post.currentUserReviewVote?.qualitativeScore;
  const qualitativeScoreDisplay = qualitativeScore ? getCostData({costTotal})[qualitativeScore].value : "";
  // note: this needs to be ||, not ??, because quadraticScore defaults to 0 rather than null
  const userReviewVote = post.currentUserReviewVote?.quadraticScore || qualitativeScoreDisplay;

  const visitedDate = markedVisitedAt ?? post.lastVisitedAt
  const unreadComments = hasUnreadComments(visitedDate, post.lastCommentedAt)

  const [commentsVisible, setCommentsVisible] = useState(false);

  const toggleComments = () => {
    setCommentsVisible(!commentsVisible);
  };
  

  // TODO: debug reviewCount = null
  return <AnalyticsContext pageElementContext="voteTableRow">
    <div className={classNames(classes.root, {[classes.expanded]: expanded, [classes.votingPhase]: reviewPhase === "VOTING" })} onClick={markAsRead}>
      {showKarmaVotes && <PostInteractionStripe post={post}/>}
      <div className={classNames(classes.postVote, {[classes.postVoteVotingPhase]: reviewPhase === "VOTING"})}>
        <div className={classes.expandPostButtonContainer} onClick={() => handleSetExpandedPost(post)}>
          <ForumIcon
            icon={expanded ? "ChevronRight" : "ChevronLeft"}
            className={classNames(classes.expandPostButton, { [classes.expanded]: expanded })}
          />
        </div>
        <div className={classNames(classes.postIndex, {[classes.top50]: index < 50})} onClick={() => handleSetExpandedPost(post, true)}>
          {index + 1}
        </div>
        <div className={classNames(classes.post, {[classes.postVotingPhase]: reviewPhase === "VOTING"})}>
          <PostsTooltip post={post} flip={false}>
            <PostsTitle post={post} showIcons={false} wrap curatedIconLeft={false} />
          </PostsTooltip>
          <span className={classes.author}>
            <UsersNameDisplay user={post.user}/>
          </span>
        </div>
        <div className={classes.commentsCount}>
          <PostsItemComments
            small={false}
            commentCount={postGetCommentCount(post)}
            unreadComments={unreadComments}
            newPromotedComments={false}
            onClick={toggleComments}
          />
        </div>
        {reviewPhase === "VOTING" && <div className={classes.reviews}>
          <ReviewPostComments
            singleLine
            hideReviewVoteButtons
            singleLineCollapse
            placeholderCount={post.reviewCount}
            terms={{
              view: "reviews",
              reviewYear: reviewYear, 
              postId: post._id
            }}
            post={post}
          />
        </div>}
        {reviewPhase === "NOMINATIONS" && <PostsItem2MetaInfo className={classes.count}>
          <LWTooltip title={<div>
            <div>This post has {positiveVoteCountTooltip}.</div>
            <div><em>(It needs at least 2 to proceed to the Review Phase.)</em></div>
          </div>}>
            { positiveVoteCountText }
          </LWTooltip>
        </PostsItem2MetaInfo>}
        {(reviewPhase === "NOMINATIONS" || reviewPhase === "REVIEWS" || reviewPhase === "COMPLETE") && <PostsItem2MetaInfo className={classes.count}>
          <LWTooltip title={`This post has ${post.reviewCount} review${post.reviewCount !== 1 ? "s" : ""}`}>
            { post.reviewCount }
          </LWTooltip>
        </PostsItem2MetaInfo>}
        {(reviewPhase === "REVIEWS" || reviewPhase === "COMPLETE") && <div className={classes.votes}>
          <LWTooltip title={voteTooltip} placement="top-end">
            <div className={classes.voteResults}>
              { allVotes.map((v, i)=>
                <span className={classes.reviewVote} key={`${post._id}${i}H`}>
                  {v}
                </span>
              )}
            </div>
          </LWTooltip>
          {eligibleToNominate(currentUser) && <div className={classes.yourVote}>
            <PostsItemReviewVote post={post} marginRight={false}/>
          </div>}
          {currentUserIsAuthor && <LWTooltip title="You can't vote on your own posts">
            <div className={classes.disabledVote}>Can't Vote</div>
          </LWTooltip>}
          
          {/* if you're looking at an old review, just show your vote (without the ability to change it) */}
          {reviewPhase === "COMPLETE" && !currentUserIsAuthor && <LWTooltip title={"Your review vote for this post"}>
            <span className={classes.oldVote}>{userReviewVote}</span>
          </LWTooltip>}
        </div>}
        {(reviewPhase === "NOMINATIONS" || reviewPhase === "VOTING") && eligibleToNominate(currentUser) && <div className={classNames(classes.votes, {[classes.votesVotingPhase]: reviewPhase === "VOTING"})}>
          {!currentUserIsAuthor && <div onClick={(e) => e.stopPropagation()}>
            <ReviewVotingButtons post={post} dispatch={dispatch} costTotal={costTotal} currentUserVote={currentVote} />
          </div>}
          {currentUserIsAuthor && <MetaInfo className={classes.cantVote}>You can't vote on your own posts</MetaInfo>}
        </div>}
      </div>
      {commentsVisible && <div className={classes.newCommentsSection} onClick={toggleComments}>
        <PostsItemNewCommentsWrapper
          terms={commentTerms}
          post={post}
          treeOptions={{
            highlightDate: post.lastVisitedAt ?? undefined,
            condensed: true,
          }}
        />
      </div>}
    </div>
  </AnalyticsContext>
}

const ReviewVoteTableRowComponent = registerComponent("ReviewVoteTableRow", ReviewVoteTableRow, {
  styles,
  //areEqual: "auto"
});

declare global {
  interface ComponentTypes {
    ReviewVoteTableRow: typeof ReviewVoteTableRowComponent
  }
}
