import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import type { SyntheticQuadraticVote, SyntheticReviewVote } from './ReviewVotingPage';
import { postGetCommentCount } from "../../lib/collections/posts/helpers";
import { eligibleToNominate, getReviewPhase } from '../../lib/reviewUtils';
import indexOf from 'lodash/indexOf'
import pullAt from 'lodash/pullAt'
import { voteTextStyling } from './PostsItemReviewVote';
import { useRecordPostView } from '../common/withRecordPostView';

const styles = (theme: ThemeType) => ({
  root: {
    borderBottom: "solid 1px rgba(0,0,0,.15)",
    position: "relative",
    '&:hover': {
      '& $expand': {
        display: "block"
      }
    },
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
      background: "rgba(0,0,0,.05)"
    }
  },
  post: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 8,
    paddingRight: 10,
    maxWidth: "calc(100% - 240px)",
    marginRight: "auto",
    [theme.breakpoints.down('xs')]: {
      maxWidth: "unset",
      width: "100%",
      background: "white"
    }
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
    backgroundColor: "rgba(0,0,0,.05)",
    padding: 10,
    alignSelf: "stretch",
    display: "flex",
    alignItems: "center",
  },
  yourVote: {
    marginLeft: 6
  },
  voteResults: {
    width: 140,
    ...theme.typography.commentStyle,
    fontSize: 12,
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
  { post, dispatch, dispatchQuadraticVote, useQuadratic, classes, expandedPostId, currentVote, showKarmaVotes }: {
    post: PostsListWithVotes,
    dispatch: React.Dispatch<SyntheticReviewVote>,
    dispatchQuadraticVote: any,
    showKarmaVotes: boolean,
    useQuadratic: boolean,
    classes:ClassesType,
    expandedPostId?: string|null,
    currentVote: SyntheticReviewVote|null,
  }
) => {
  const { PostsTitle, LWTooltip, PostsPreviewTooltip, MetaInfo, QuadraticVotingButtons, ReviewVotingButtons, PostsItemComments, PostsItem2MetaInfo, PostsItemReviewVote } = Components

  const currentUser = useCurrentUser()

  const [markedVisitedAt, setMarkedVisitedAt] = useState<Date|null>(null);
  const { recordPostView } = useRecordPostView(post);
  const markAsRead = () => {
    recordPostView({post, extraEventProperties: {type: "markAsRead"}})
    setMarkedVisitedAt(new Date()) 
  }

  if (!currentUser) return null;
  const expanded = expandedPostId === post._id

  const currentUserIsAuthor = post.userId === currentUser._id || post.coauthors?.map(author => author?._id).includes(currentUser._id)

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
    <div className={classNames(classes.root, {[classes.expanded]: expanded})} onClick={markAsRead}>
      {showKarmaVotes && post.currentUserVote && <LWTooltip title={`You gave this post ${voteMap[post.currentUserVote]}`} placement="left" inlineBlock={false}>
          <div className={classNames(classes.userVote, classes[post.currentUserVote])}/>
        </LWTooltip>}
      <div className={classes.postVote}>
        <div className={classes.post}>
          <LWTooltip title={<PostsPreviewTooltip post={post}/>} tooltip={false} flip={false}>
            <PostsTitle post={post} showIcons={false} showLinkTag={false} wrap curatedIconLeft={false} />
          </LWTooltip>
        </div>
        <PostsItemComments
          small={false}
          commentCount={postGetCommentCount(post)}
          unreadComments={(post.lastVisitedAt < (markedVisitedAt || post.lastCommentedAt))}
          newPromotedComments={false}
        />
        <PostsItem2MetaInfo className={classes.count}>
          <LWTooltip title={`This post has ${post.reviewCount} review${post.reviewCount > 1 ? "s" : ""}`}>
            { post.reviewCount }
          </LWTooltip>
        </PostsItem2MetaInfo>
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
            <div className={classes.disabledVote}>Vote</div>
          </LWTooltip>}
        </div>}
        {getReviewPhase() !== "REVIEWS" && eligibleToNominate(currentUser) && <div className={classes.votes}>
          {!currentUserIsAuthor && <div>{useQuadratic ?
            <QuadraticVotingButtons postId={post._id} voteForCurrentPost={currentVote as SyntheticQuadraticVote} vote={dispatchQuadraticVote} /> :
            <ReviewVotingButtons post={post} dispatch={dispatch} currentUserVoteScore={currentVote?.score || null} />}
          </div>}
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
