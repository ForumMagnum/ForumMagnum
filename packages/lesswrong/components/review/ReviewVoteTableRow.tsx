import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import type { SyntheticQuadraticVote, SyntheticQualitativeVote, SyntheticReviewVote } from './ReviewVotingPage';
import { postGetCommentCount } from "../../lib/collections/posts/helpers";
import { eligibleToNominate, getReviewPhase, REVIEW_YEAR } from '../../lib/reviewUtils';
import indexOf from 'lodash/indexOf'
import pullAt from 'lodash/pullAt'
import { voteTextStyling } from './PostsItemReviewVote';
import { useRecordPostView } from '../common/withRecordPostView';

const styles = (theme: ThemeType) => ({
  root: {
    borderBottom: "solid 1px rgba(0,0,0,.15)",
    position: "relative",
    background: "white",
    '&:hover': {
      '& $expand': {
        display: "block"
      }
    },
    [theme.breakpoints.down('xs')]: {
      marginBottom: 2,
      boxShadow: theme.boxShadow
    }
  },
  votingPhase: {
    marginTop: 20,
    border: "solid 1px rgba(0,0,0,.1)",
    boxShadow: "0 1px 3px 0px rgba(0,0,0,.05)"
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
    justifyContent: "flex-end",
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      flexWrap: "wrap",
    }
  },
  postVoteVotingPhase: {
    flexWrap: "wrap",
  },
  post: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 8,
    paddingRight: 10,
    maxWidth: "calc(100% - 240px)",
    marginRight: "auto",
    [theme.breakpoints.down('xs')]: {
      maxWidth: "calc(100% - 100px)",
      background: "white"
    }
  },
  postVotingPhase: {
    width: "100%"
  },
  reviews: {
    width: "100%",
    position: "relative",
    left: -6
  },
  expand: {
    display:"none",
    position: "absolute",
    bottom: 2,
    fontSize: 10,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[400],
    paddingBottom: 35
  },
  expanded: {
    backgroundColor: "#f0f0f0",
  },
  highlight: {
    padding: 16,
    background: "#f9f9f9",
    borderTop: "solid 1px rgba(0,0,0,.1)"
  },
  userVote: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: 6,
    background: "#bbb"
  },
  expandIcon: {
    color: theme.palette.grey[500],
    width: 36,
  },
  bigUpvote: {
    background: theme.palette.primary.dark
  },
  smallUpvote: {
    background: theme.palette.primary.light
  },
  bigDownvote: {
    background: theme.palette.error.dark
  },
  smallDownvote: {
    background: theme.palette.error.light
  },
  votes: {
    backgroundColor: "#eee",
    padding: 10,
    alignSelf: "stretch",
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      padding: 7,
      width: "100%"
    }
  },
  votesVotingPhase: {
    backgroundColor: "unset",
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
  highVote: {
    color: "rgba(0,0,0,.8)",
    fontWeight: 600,
    padding: 2,
    cursor: "pointer"
  },
  lowVote: {
    color: "rgba(0,0,0,.45)",
    padding: 2,
    cursor: "pointer"
  },
  disabledVote: {
    ...voteTextStyling(theme),
    color: theme.palette.grey[500],
    cursor: "default"
  },
  commentsCount: {
    paddingBottom: 8
  }
});

// TODO: this should probably live in some utility folder
const arrayDiff = (arr1:Array<any>, arr2:Array<any>) => {
  let output = [...arr1]
  arr2.forEach((value) => {
    pullAt(output, indexOf(output, value))
  })
  return output
}

const ReviewVoteTableRow = (
  { post, dispatch, costTotal, classes, expandedPostId, currentVote, showKarmaVotes }: {
    post: PostsListWithVotes,
    costTotal?: number,
    dispatch: React.Dispatch<SyntheticQualitativeVote>,
    showKarmaVotes: boolean,
    classes:ClassesType,
    expandedPostId?: string|null,
    currentVote: SyntheticQualitativeVote|null,
  }
) => {
  const { PostsTitle, LWTooltip, PostsPreviewTooltip, MetaInfo, QuadraticVotingButtons, ReviewVotingButtons, PostsItemComments, PostsItem2MetaInfo, PostsItemReviewVote, ReviewPostComments } = Components

  const currentUser = useCurrentUser()

  const [markedVisitedAt, setMarkedVisitedAt] = useState<Date|null>(null);
  const { recordPostView } = useRecordPostView(post);
  const markAsRead = () => {
    recordPostView({post, extraEventProperties: {type: "markAsRead"}})
    setMarkedVisitedAt(new Date()) 
  }

  const expanded = expandedPostId === post._id

  const currentUserIsAuthor = currentUser && (post.userId === currentUser._id || post.coauthors?.map(author => author?._id).includes(currentUser._id))

  const voteMap = {
    'bigDownvote': 'a strong downvote',
    'smallDownvote': 'a downvote',
    'smallUpvote': 'an upvote',
    'bigUpvote': 'a strong upvote'
  }

  const highVotes = post.reviewVotesHighKarma || []
  const allVotes = post.reviewVotesAllKarma || []
  const lowVotes = arrayDiff(allVotes, highVotes)
  return <AnalyticsContext pageElementContext="voteTableRow">
    <div className={classNames(classes.root, {[classes.expanded]: expanded, [classes.votingPhase]: getReviewPhase() === "VOTING" })} onClick={markAsRead}>
      {showKarmaVotes && post.currentUserVote && <LWTooltip title={`You gave this post ${voteMap[post.currentUserVote]}`} placement="left" inlineBlock={false}>
          <div className={classNames(classes.userVote, classes[post.currentUserVote])}/>
        </LWTooltip>}
      <div className={classNames(classes.postVote, {[classes.postVoteVotingPhase]: getReviewPhase() === "VOTING"})}>
        <div className={classNames(classes.post, {[classes.postVotingPhase]: getReviewPhase() === "VOTING"})}>
          <LWTooltip title={<PostsPreviewTooltip post={post}/>} tooltip={false} flip={false}>
            <PostsTitle post={post} showIcons={false} showLinkTag={false} wrap curatedIconLeft={false} />
          </LWTooltip>
        </div>
        {getReviewPhase() === "VOTING" && <div className={classes.reviews}>
          <ReviewPostComments
            singleLine
            hideReviewVoteButtons
            singleLineCollapse
            placeholderCount={post.reviewCount}
            terms={{
              view: "reviews",
              reviewYear: REVIEW_YEAR, 
              postId: post._id
            }}
            post={post}
          />
        </div>}
        <div className={classes.commentsCount}>
          <PostsItemComments
            small={false}
            commentCount={postGetCommentCount(post)}
            unreadComments={(markedVisitedAt || post.lastVisitedAt) < post.lastCommentedAt}
            newPromotedComments={false}
          />
        </div>
        {getReviewPhase() !== "VOTING" && <PostsItem2MetaInfo className={classes.count}>
          <LWTooltip title={`This post has ${post.reviewCount} review${post.reviewCount > 1 ? "s" : ""}`}>
            { post.reviewCount }
          </LWTooltip>
        </PostsItem2MetaInfo>}
        {getReviewPhase() === "REVIEWS" && <div className={classes.votes}>
          <div className={classes.voteResults}>
            { highVotes.map((v, i)=>
              <LWTooltip className={classes.highVote} title="Voters with 1000+ karma" key={`${post._id}${i}H`}>
                  {v}
              </LWTooltip>
            )}
            { lowVotes.map((v, i)=>
              <LWTooltip className={classes.lowVote} title="Voters with less than 1000 karma" key={`${post._id}${i}L`}>
                  {v}
              </LWTooltip>
            )}
            
          </div>
          {eligibleToNominate(currentUser) && <div className={classes.yourVote}>
            <PostsItemReviewVote post={post} marginRight={false}/>
          </div>}
          {currentUserIsAuthor && <LWTooltip title="You can't vote on your own posts">
            <div className={classes.disabledVote}>Can't Vote</div>
          </LWTooltip>}
        </div>}
        {getReviewPhase() !== "REVIEWS" && eligibleToNominate(currentUser) && <div className={classNames(classes.votes, {[classes.votesVotingPhase]: getReviewPhase() === "VOTING"})}>
          {!currentUserIsAuthor && <ReviewVotingButtons post={post} dispatch={dispatch} costTotal={costTotal} currentUserVote={currentVote} />}
          {currentUserIsAuthor && <MetaInfo>You can't vote on your own posts</MetaInfo>}
        </div>}

      </div>
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
