import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import moment from '../../lib/moment-timezone';
import { useHover } from '../common/withHover';
import { useCurrentUser } from '../common/withUser';
import { useVote } from './withVote';
import Tooltip from '@material-ui/core/Tooltip';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { Comments } from '../../lib/collections/comments/collection';
import { Posts } from '../../lib/collections/posts/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import {VoteDimensionString, VotingSystemString} from "../../lib/voting/voteTypes";

const styles = (theme: ThemeType): JssStyles => ({
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

const SmallSideVote = ({ document, hideKarma=false, voteDimension = "Overall", classes, collection }: {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics,
  hideKarma?: boolean,
  voteDimension?: VoteDimensionString,
  classes: ClassesType,
  collection: any
}) => {
  const currentUser = useCurrentUser();
  const voteProps = useVote(document, collection.options.collectionName);
  const {eventHandlers, hover} = useHover();
  
  if (!document) return null;

  const { VoteButton } = Components

  const voteCount = voteProps.voteCount;
  const karma = voteProps.baseScore;

  let moveToAlignnmentUserId = ""
  let documentTypeName = "comment";
  if (collection == Comments) {
    const comment = document as CommentsList
    moveToAlignnmentUserId = comment.moveToAlignmentUserId
  }
  if (collection == Posts) {
    documentTypeName = "post";
  }
  if (collection == Revisions) {
    documentTypeName = "revision";
  }

  const af = (document as any).af;
  const afDate = (document as any).afDate;
  const afBaseScore = (document as any).afBaseScore;
  
  const moveToAfInfo = userIsAdmin(currentUser) && !!moveToAlignnmentUserId && (
    <div className={classes.tooltipHelp}>
      {hover && <span>Moved to AF by <Components.UsersName documentId={moveToAlignnmentUserId }/> on { afDate && moment(new Date(afDate)).format('YYYY-MM-DD') }</span>}
    </div>
  )

  return (
    <span className={classes.vote} {...eventHandlers}>
      {(forumTypeSetting.get() !== 'AlignmentForum' || !!af) &&
        <>
          <Tooltip
            title={<div>Downvote<br /><em>For strong downvote, click-and-hold<br />(Click twice on mobile)</em></div>}
            placement="bottom"
            >
            <span>
              <VoteButton
                orientation="left"
                color="error"
                voteType="Downvote"
                voteDimension={voteDimension}
                {...voteProps}
              />
            </span>
          </Tooltip>
          {hideKarma ?
            <Tooltip title={'The author of this post has disabled karma visibility'}>
              <span>{' '}</span>
            </Tooltip> :
            <Tooltip title={`This ${documentTypeName} has ${karma} karma (${voteCount} ${voteCount == 1 ? "Vote" : "Votes"})`} placement="bottom">
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
                voteDimension={voteDimension}
                {...voteProps}
              />
            </span>
          </Tooltip> 
        </>
      }
      {!!af && forumTypeSetting.get() !== 'AlignmentForum' &&
        <Tooltip placement="bottom" title={
          <div>
            <p>AI Alignment Forum Karma</p>
            { moveToAfInfo }
          </div>
        }>
          <span className={classes.secondaryScore}>
            <span className={classes.secondarySymbol}>Ω</span>
            <span className={classes.secondaryScoreNumber}>{afBaseScore || 0}</span>
          </span>
        </Tooltip>
      }
      {!af && (forumTypeSetting.get() === 'AlignmentForum') &&
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

