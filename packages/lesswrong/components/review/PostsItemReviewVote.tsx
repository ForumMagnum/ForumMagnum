import React, { useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import Card from '@material-ui/core/Card';
import { useCurrentUser } from '../common/withUser';
import { indexToTermsLookup } from './ReviewVotingButtons';
import { forumTitleSetting, forumTypeSetting } from '../../lib/instanceSettings';
import { canNominate, REVIEW_YEAR } from '../../lib/reviewUtils';

const isEAForum = forumTypeSetting.get() === "EAForum"

const styles = (theme: ThemeType): JssStyles => ({
  button: {
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    cursor: "pointer",
    width: 28,
    marginRight: 10,
    textAlign: "center"
  },
  card: {
    padding: isEAForum ? "8px 24px" : 8,
    textAlign: "center",
  },
  reviewButton: {
    paddingTop: 4,
    paddingBottom: 4,
    ...theme.typography.body2,
    color: theme.palette.primary.main
  }
})

const PostsItemReviewVote = ({classes, post}: {classes:ClassesType, post:PostsList}) => {
  const { ReviewVotingWidget, LWPopper, LWTooltip, ReviewPostButton } = Components
  const [anchorEl, setAnchorEl] = useState<any>(null)
  const [newVote, setNewVote] = useState<number|null>(null)

  const currentUser = useCurrentUser()

  if (!canNominate(currentUser, post)) return null

  const displayVote = indexToTermsLookup[newVote || post.currentUserReviewVote]?.label

  return <div onMouseLeave={() => setAnchorEl(null)}>

    <LWTooltip title={<div>Nominate this post by casting a preliminary vote.</div>} placement="right">
      <div className={classes.button} onClick={(e) => setAnchorEl(e.target)}>
        {displayVote || "Vote"}
      </div>
    </LWTooltip>

    <LWPopper placement="right" anchorEl={anchorEl} open={!!anchorEl}>
      <Card className={classes.card}>
        <ReviewVotingWidget post={post} setNewVote={setNewVote}/>
        <ReviewPostButton post={post} year={REVIEW_YEAR+""} reviewMessage={<LWTooltip title={`Write up your thoughts on what was good about a post, how it could be improved, and how you think stands the tests of time as part of the broader ${forumTitleSetting.get()} conversation`} placement="bottom">
        <div className={classes.reviewButton}>Write a Review</div>
      </LWTooltip>}/>
      </Card>
    </LWPopper>
  </div>
}

const PostsItemReviewVoteComponent = registerComponent('PostsItemReviewVote', PostsItemReviewVote, {styles});

declare global {
  interface ComponentTypes {
    PostsItemReviewVote: typeof PostsItemReviewVoteComponent
  }
}
