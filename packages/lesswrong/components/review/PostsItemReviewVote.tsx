import React, { useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import Card from '@material-ui/core/Card';
import { canNominate, REVIEW_NAME } from '../../lib/reviewUtils';
import { useCurrentUser } from '../common/withUser';

const styles = theme => ({
  button: {
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    paddingLeft: 6,
    paddingRight: 12,
    cursor: "pointer"
  },
  disabled: {
    cursor: "unset",
    color: theme.palette.grey[500]
  }
})

const PostsItemReviewVote = ({classes, post}:{classes:ClassesType, post:PostsBase}) => {
  const { ReviewVotingWidget, LWPopper, LWTooltip } = Components
  const [anchorEl, setAnchorEl] = useState<any>(null)

  const currentUser = useCurrentUser()

  if (!canNominate(currentUser, post)) return null

  return <div onMouseLeave={() => setAnchorEl(null)}>

    <LWTooltip title={<div><div>Cast a preliminary vote in the {REVIEW_NAME}</div><div>Posts need at least one vote to pass to the Review Phase.</div></div>} placement="right">
      <div className={classes.button} onClick={(e) => setAnchorEl(e.target)}>
        Vote
      </div>
    </LWTooltip>

    <LWPopper placement="right" anchorEl={anchorEl} open={!!anchorEl}>
      <Card className={classes.card}>
        <ReviewVotingWidget post={post} />
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
