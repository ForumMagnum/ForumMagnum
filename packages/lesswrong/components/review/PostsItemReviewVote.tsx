import React, { useState } from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { Card } from "@/components/widgets/Paper";
import { useCurrentUser } from '../common/withUser';
import { forumTitleSetting } from '../../lib/instanceSettings';
import { canNominate, getCostData, getReviewPhase, REVIEW_YEAR, VoteIndex } from '../../lib/reviewUtils';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';
import { ReviewVotingWidget } from "./ReviewVotingWidget";
import { LWPopper } from "../common/LWPopper";
import { LWTooltip } from "../common/LWTooltip";
import { ReviewPostButton } from "./ReviewPostButton";

export const voteTextStyling = (theme: ThemeType) => ({
  ...theme.typography.smallText,
  ...theme.typography.commentStyle,
  textAlign: "center",
  width: 40,
})

const styles = (theme: ThemeType) => ({
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
    marginLeft: 10
  }
})

const PostsItemReviewVoteInner = ({classes, post, marginRight=true}: {classes: ClassesType<typeof styles>, post: PostsListBase, marginRight?: boolean}) => {
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
        {(voteIndex !== 0)
          ? (
            <span className={classNames(
              classes.button,
              [(classes as AnyBecauseTodo)[voteIndex]],
            )}>
              {displayVote}
            </span>
          )
          : <span className={classes.voteButton}>Vote</span>
        }
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

export const PostsItemReviewVote = registerComponent('PostsItemReviewVote', PostsItemReviewVoteInner, {styles});


