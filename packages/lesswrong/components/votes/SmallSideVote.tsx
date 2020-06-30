import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Comments } from "../../lib/collections/comments";
import { Posts } from "../../lib/collections/posts";
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
    display: "inline-block"
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

const SmallSideVote = ({ document, hideKarma=false, classes, collection }: {
  document: CommentsList|PostsList,
  hideKarma?: boolean,
  classes: ClassesType,
  collection: any
}) => {
  const currentUser = useCurrentUser();
  const vote = useVote();
  const {eventHandlers, hover} = useHover();
  
  if (!document) return null;

  const { VoteButton } = Components
  const voteCount = document.voteCount;
  let karma = 0
  let moveToAlignnmentUserId = ""
  if (collection === Posts) {
    karma = Posts.getKarma(document as PostsBase)
  }
  if (collection == Comments) {
    const comment = document as CommentsList
    karma = Comments.getKarma(comment)
    moveToAlignnmentUserId = comment.moveToAlignmentUserId
  }

  const moveToAfInfo = Users.isAdmin(currentUser) && !!moveToAlignnmentUserId && (
    <div className={classes.tooltipHelp}>
      {hover && <span>Moved to AF by <Components.UsersName documentId={moveToAlignnmentUserId }/> on { document.afDate && moment(new Date(document.afDate)).format('YYYY-MM-DD') }</span>}
    </div>
  )

  return (
    <span className={classes.vote} {...eventHandlers}>
      {(forumTypeSetting.get() !== 'AlignmentForum' || !!document.af) &&
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
                document={document}
                currentUser={currentUser}
                collection={collection}
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
                document={document}
                currentUser={currentUser}
                collection={collection}
                vote={vote}
              />
            </span>
          </Tooltip>
        </span>
      }
      {!!document.af && forumTypeSetting.get() !== 'AlignmentForum' &&
        <Tooltip placement="bottom" title={
          <div>
            <p>AI Alignment Forum Karma</p>
            { moveToAfInfo }
          </div>
        }>
          <span className={classes.secondaryScore}>
            <span className={classes.secondarySymbol}>Ω</span>
            <span className={classes.secondaryScoreNumber}>{document.afBaseScore || 0}</span>
          </span>
        </Tooltip>
      }
      {!document.af && (forumTypeSetting.get() === 'AlignmentForum') &&
        <Tooltip title="LessWrong Karma" placement="bottom">
          <span className={classes.secondaryScore}>
            <span className={classes.secondarySymbol}>LW</span>
            <span className={classes.secondaryScoreNumber}>{document.baseScore || 0}</span>
          </span>
        </Tooltip>
      }
    </span>)
}

const SmallSideVoteComponent = registerComponent('SmallSideVote', SmallSideVote, {styles});

declare global {
  interface ComponentTypes {
    SmallSideVote: typeof SmallSideVoteComponent
  }
}

