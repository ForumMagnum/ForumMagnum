import React, { useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import Card from '@material-ui/core/Card';
import { canNominate } from '../../lib/reviewUtils';
import { useCurrentUser } from '../common/withUser';
import { indexToTermsLookup } from './ReviewVotingButtons';

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
    padding: 12,
  },
  disabled: {
    cursor: "unset",
    color: theme.palette.grey[500]
  }
})

const PostsItemReviewVote = ({classes, post}: {classes:ClassesType, post:PostsList}) => {
  const { ReviewVotingWidget, LWPopper, LWTooltip } = Components
  const [anchorEl, setAnchorEl] = useState<any>(null)
  const [newVote, setNewVote] = useState<string|null>(null)

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
