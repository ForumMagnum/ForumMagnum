import React, { useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import Card from '@material-ui/core/Card';
import { useCurrentUser } from '../common/withUser';
import { indexToTermsLookup } from './ReviewVotingButtons';
import { forumTitleSetting, forumTypeSetting } from '../../lib/instanceSettings';
import { canNominate, getReviewPhase, REVIEW_YEAR } from '../../lib/reviewUtils';
import classNames from 'classnames';

const isEAForum = forumTypeSetting.get() === "EAForum"

export const voteTextStyling = theme => ({
  ...theme.typography.smallText,
  ...theme.typography.commentStyle,
  textAlign: "center",
  width: 28,
})

const styles = (theme: ThemeType): JssStyles => ({
  buttonWrapper: {
    cursor: "pointer",
    ...voteTextStyling(theme)
  },
  style9: {
    color: theme.palette.primary.dark,
    border: `solid 2px ${theme.palette.primary.dark}`
  },
  style4: {

  },
  style1: {

  },
  style0: {

  },
  styleMinus1: {

  },
  styleMinus4: {

  },
  styleMinus9: {

  },
  button: {
    border: "solid 1px rgba(0,0,0,.2)",
    borderRadius: 3,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 6,
    paddingRight: 6
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
  },
  marginRight: {
    marginRight: 10
  }
})

const PostsItemReviewVote = ({classes, post, marginRight=true}: {classes:ClassesType, post:PostsListBase, marginRight?: boolean}) => {
  const { ReviewVotingWidget, LWPopper, LWTooltip, ReviewPostButton } = Components
  const [anchorEl, setAnchorEl] = useState<any>(null)
  const [newVote, setNewVote] = useState<number|null>(null)

  const currentUser = useCurrentUser()

  if (!canNominate(currentUser, post)) return null

  const displayVote = indexToTermsLookup[newVote || post.currentUserReviewVote]?.label
  const nominationsPhase = getReviewPhase() === "NOMINATIONS"

  return <div onMouseLeave={() => setAnchorEl(null)}>

    <LWTooltip title={`${nominationsPhase ? "Nominate this post by casting a preliminary vote" : "Update your vote"}`} placement="right">
      <div className={classNames(classes.buttonWrapper, {[classes.marginRight]:marginRight})} onClick={(e) => setAnchorEl(e.target)}>
        {displayVote ? <span className={classNames(classes.button)}>{displayVote}</span> : "Vote"}
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
