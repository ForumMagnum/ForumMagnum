import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import moment from '../../lib/moment-timezone';
import { useHover } from '../common/withHover';
import { useCurrentUser } from '../common/withUser';
import { useVote } from './withVote';
import type { UseVoteProps } from './withVote';
import Tooltip from '@material-ui/core/Tooltip';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { Comments } from '../../lib/collections/comments/collection';
import { Posts } from '../../lib/collections/posts/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import {VoteDimensionString, VotingSystemString} from "../../lib/voting/voteTypes";

const styles = (theme: ThemeType): JssStyles => ({
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
  }
})

type SideVoteableType = CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics

const SmallSideVoteSingle =  <T extends SideVoteableType>({ document, hideKarma=false, voteDimension, classes, collection, voteProps }: {
  document: SideVoteableType,
  hideKarma?: boolean,
  voteDimension: VoteDimensionString,
  classes: ClassesType,
  collection: any,
  voteProps: UseVoteProps<T>
}) => {
  const currentUser = useCurrentUser();
  const {eventHandlers} = useHover();
  
  if (!document) return null;

  const { VoteButton } = Components

  // TODO: don't hard-code Agreement?
  const voteCount = (voteDimension === 'Overall') ? voteProps.voteCount : voteProps?.voteCountsRecord?.['Agreement'] || 0
  const karma = (voteDimension === 'Overall') ? voteProps.baseScore : voteProps?.baseScoresRecord?.['Agreement'] || 0
  const karmaAdjective = (voteDimension === 'Overall') ? '' : `${voteDimension.toLowerCase()} `

  let documentTypeName = "comment";

  if (collection == Posts) {
    documentTypeName = "post";
  }
  if (collection == Revisions) {
    documentTypeName = "revision";
  }

  const af = (document as any).af;
  const afDate = (document as any).afDate;
  const afBaseScore = (document as any).afBaseScore;

  return (
    <span {...eventHandlers}>
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
            <Tooltip title={`This ${documentTypeName} has ${karma} ${karmaAdjective}karma (${voteCount} ${voteCount == 1 ? "Vote" : "Votes"})`} placement="bottom">
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

const SmallSideVoteSingleComponent = registerComponent('SmallSideVoteSingle', SmallSideVoteSingle, {styles});

declare global {
  interface ComponentTypes {
    SmallSideVoteSingle: typeof SmallSideVoteSingleComponent
  }
}

