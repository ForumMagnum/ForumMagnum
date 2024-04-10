import React, { useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import Card from '@material-ui/core/Card';
import { useCurrentUser } from '../common/withUser';
import { forumTitleSetting } from '../../lib/instanceSettings';
import { canNominate, getCostData, getReviewPhase, REVIEW_YEAR, VoteIndex } from '../../lib/reviewUtils';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';

export const voteTextStyling = (theme: ThemeType): JssStyles => ({
  ...theme.typography.smallText,
  ...theme.typography.commentStyle,
  textAlign: "center",
  width: 40,
})

const styles = (theme: ThemeType): JssStyles => ({
  buttonWrapper: {
    cursor: "pointer",
    ...voteTextStyling(theme)
  },
  7: {
    color: theme.palette.text.invertedBackgroundText,
    background: theme.palette.grey[700]
  },
  6: {
    color: theme.palette.text.invertedBackgroundText,
    background: theme.palette.grey[500]
  },
  5: {
    background: theme.palette.grey[300]
  },
  4: {
    color: theme.palette.grey[600]
  },
  3: {
    background: theme.palette.grey[300]
  },
  2: {
    color: theme.palette.text.invertedBackgroundText,
    background: theme.palette.error.light
  },
  1: {
    color: theme.palette.text.invertedBackgroundText,
    background: theme.palette.error.dark
  },
  button: {
    border: theme.palette.border.normal,
    borderRadius: 3,
    paddingTop: 2,
    paddingBottom: 2,
    width: 24,
    display: "inline-block"
  },
  voteButton: {
    border: theme.palette.border.normal,
    borderRadius: 3,
    paddingTop: 2,
    paddingBottom: 2,
    width: 40,
    display: "inline-block"
  },
  card: {
    padding: isFriendlyUI ? "8px 24px" : 8,
    textAlign: "center",
  },
  reviewButton: {
    paddingTop: 4,
    paddingBottom: 4,
    ...theme.typography.body2,
    color: theme.palette.primary.main
  },
  marginRight: {
    marginRight: 10,
    marginLeft: 10
  }
})

const PostsItemReviewVote = ({classes, post, marginRight=true}: {classes: ClassesType, post: PostsListBase, marginRight?: boolean}) => {
  const { ReviewVotingWidget, LWPopper, LWTooltip, ReviewPostButton } = Components
  const [anchorEl, setAnchorEl] = useState<any>(null)
  const [newVote, setNewVote] = useState<VoteIndex|null>(null)

  const currentUser = useCurrentUser()

  if (!canNominate(currentUser, post)) return null

  const voteIndex = newVote || post.currentUserReviewVote?.qualitativeScore || 0
  const displayVote = getCostData({})[voteIndex as VoteIndex]?.value
  const nominationsPhase = getReviewPhase() === "NOMINATIONS"

  return <div onMouseLeave={() => setAnchorEl(null)}>

    <LWTooltip title={`${nominationsPhase ? "Nominate this post by casting a nomination vote" : "Update your vote"}`} placement="right">
      <div className={classNames(classes.buttonWrapper, {[classes.marginRight]:marginRight})} onClick={(e) => setAnchorEl(e.target)}>
        {(voteIndex !== 0) ? <span className={classNames(classes.button, [classes[voteIndex]])}>{displayVote}</span> : <span className={classes.voteButton}>Vote</span>}
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
