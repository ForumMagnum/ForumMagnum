import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { eligibleToNominate, getReviewPhase } from '../../lib/reviewUtils';
import { useCurrentUser } from '../common/withUser';
import { arrayDiff } from './ReviewVoteTableRow';
import { voteTextStyling } from './PostsItemReviewVote';
import { reviewCells } from './ReviewFullDashboard';

const styles = theme => ({
  root: {
    
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
    padding: 10,
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
  },
  ...reviewCells(theme)
})

const ReviewFullDashboardRow = ({classes, post, reviewYear}) => {
  
  const { ReviewPostComments, SmallPingbacksList, LWTooltip, PostsPreviewTooltip, PostsTitle,  PostsItemReviewVote } = Components

  const currentUser = useCurrentUser()

  const currentUserIsAuthor = post.userId === currentUser._id || post.coauthors?.map(author => author?._id).includes(currentUser._id)

  const highVotes = post.reviewVotesHighKarma || []
  const allVotes = post.reviewVotesAllKarma || []
  const lowVotes = arrayDiff(allVotes, highVotes)

  return <TableRow key={post._id}>
    <TableCell className={classes.titleCell}>
      <LWTooltip title={<PostsPreviewTooltip post={post}/>} tooltip={false} flip={false}>
        <PostsTitle post={post} showIcons={false} showLinkTag={false} wrap curatedIconLeft={false} />
      </LWTooltip>
    </TableCell>
    <TableCell className={classes.pingBacksCell}>
      <SmallPingbacksList postId={post._id}/>
    </TableCell>
    <TableCell className={classes.reviewsCell}>
      <ReviewPostComments
        terms={{
          view: "reviews",
          reviewYear: reviewYear, 
          postId: post._id
        }}
        post={post}
        singleLine
      />
    </TableCell>
    <TableCell className={classes.voteCell}>
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
      {/* {getReviewPhase() !== "REVIEWS" && eligibleToNominate(currentUser) && <TableCell className={classes.votes}>
        {!currentUserIsAuthor && <ReviewVotingButtons post={post} dispatch={dispatch} currentUserVoteScore={currentVote?.score || null} />}
        {currentUserIsAuthor && <MetaInfo>You can't vote on your own posts</MetaInfo>}
      </div>} */}
    </TableCell>
  </TableRow>
}

const ReviewFullDashboardRowComponent = registerComponent('ReviewFullDashboardRow', ReviewFullDashboardRow, {styles});

declare global {
  interface ComponentTypes {
    ReviewFullDashboardRow: typeof ReviewFullDashboardRowComponent
  }
}
