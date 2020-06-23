import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Comments } from "../../lib/collections/comments";
import Users from '../../lib/collections/users/collection';
import moment from '../../lib/moment-timezone';
import { useHover } from '../common/withHover';
import { useCurrentUser } from '../common/withUser';
import { useVote } from './withVote';
import Tooltip from '@material-ui/core/Tooltip';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = theme => ({
  vote: {
    fontSize: 25,
    lineHeight: 0.6,
  },
  voteScore: {
    fontSize: '1.1rem',
    marginLeft: 4,
    marginRight: 4,
    lineHeight: 1,
  },
  secondarySymbol: {
    fontFamily: theme.typography.body1.fontFamily,
  },
  secondaryScore: {
    fontSize: '1.1rem',
    marginLeft: 7,
  },
  secondaryScoreNumber: {
    marginLeft: 3,
  },
  tooltipHelp: {
    fontSize: '1rem',
    fontStyle: "italic"
  }
})

const CommentsVote = ({ comment, hideKarma=false, classes }: {
  comment: CommentsList,
  hideKarma?: boolean,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const vote = useVote("Comments");
  const {eventHandlers, hover} = useHover();
  
  if (!comment) return null;

  const { VoteButton } = Components
  const voteCount = comment.voteCount;
  const karma = Comments.getKarma(comment)

  const moveToAfInfo = Users.isAdmin(currentUser) && !!comment.moveToAlignmentUserId && (
    <div className={classes.tooltipHelp}>
      {hover && <span>Moved to AF by <Components.UsersName documentId={comment.moveToAlignmentUserId }/> on { comment.afDate && moment(new Date(comment.afDate)).format('YYYY-MM-DD') }</span>}
    </div>
  )

  return (
    <span className={classes.vote} {...eventHandlers}>
      {(forumTypeSetting.get() !== 'AlignmentForum' || !!comment.af) &&
        <span>
          <Tooltip
            title={<div>Downvote<br /><em>For strong downvote, click-and-hold<br />(Click twice on mobile)</em></div>}
            placement="bottom"
            >
            <span>
              <VoteButton
                orientation="left"
                color="error"
                voteType="Downvote"
                document={comment}
                collection={Comments}
                vote={vote}
              />
            </span>
          </Tooltip>
          {hideKarma ?
            <Tooltip title={'The author of this post has disabled karma visibility'}>
              <span>{' '}</span>
            </Tooltip> :
            <Tooltip title={`This comment has ${karma} karma (${voteCount} ${voteCount == 1 ? "Vote" : "Votes"})`} placement="bottom">
              <span className={classes.voteScore}>
                {karma}
              </span>
            </Tooltip>
          }
          <Tooltip
            title={<div>Upvote<br /><em>For strong upvote, click-and-hold<br /> (Click twice on mobile)</em></div>}
            placement="bottom">
            <span>
              <VoteButton
                orientation="right"
                color="secondary"
                voteType="Upvote"
                document={comment}
                collection={Comments}
                vote={vote}
              />
            </span>
          </Tooltip>
        </span>
      }
      {!!comment.af && forumTypeSetting.get() !== 'AlignmentForum' &&
        <Tooltip placement="bottom" title={
          <div>
            <p>AI Alignment Forum Karma</p>
            { moveToAfInfo }
          </div>
        }>
          <span className={classes.secondaryScore}>
            <span className={classes.secondarySymbol}>Ω</span>
            <span className={classes.secondaryScoreNumber}>{comment.afBaseScore || 0}</span>
          </span>
        </Tooltip>
      }
      {!comment.af && (forumTypeSetting.get() === 'AlignmentForum') &&
        <Tooltip title="LessWrong Karma" placement="bottom">
          <span className={classes.secondaryScore}>
            <span className={classes.secondarySymbol}>LW</span>
            <span className={classes.secondaryScoreNumber}>{comment.baseScore || 0}</span>
          </span>
        </Tooltip>
      }
    </span>)
}

const CommentsVoteComponent = registerComponent('CommentsVote', CommentsVote, {styles});

declare global {
  interface ComponentTypes {
    CommentsVote: typeof CommentsVoteComponent
  }
}

