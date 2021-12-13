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
  voteButtons: {},
  secondaryVoteButtonsExtraMargin: {
    marginLeft: 10,
    marginRight: 5
  },
  secondarySymbol: {
    fontFamily: theme.typography.body1.fontFamily,
  },
  secondaryScore: {
    fontSize: '1.1rem',
  },
  secondaryScoreExtraMargin: {
    fontSize: '1.1rem',
    marginRight: 10
  },
  secondaryScoreNumber: {
    marginLeft: 3,
  },
  tooltipHelp: {
    fontSize: '1rem',
    fontStyle: "italic"
  }
})

const SmallSideVote = ({ document, hideKarma=false, voteDimensions = ["Overall"], classes, collection }: {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics,
  hideKarma?: boolean,
  voteDimensions?: VoteDimensionString[],
  classes: ClassesType,
  collection: any
}) => {

  const currentUser = useCurrentUser();
  const voteProps = useVote(document, collection.options.collectionName);

  const {eventHandlers, hover} = useHover();

  if (!document) return null;

  let moveToAlignmentUserId = ""
  if (collection == Comments) {
    const comment = document as CommentsList
    moveToAlignmentUserId = comment.moveToAlignmentUserId
  }

  const { SmallSideVoteSingle } = Components

  const af = (document as any).af;
  const afDate = (document as any).afDate;
  const afBaseScore = (document as any).afBaseScore;

  const moveToAfInfo = userIsAdmin(currentUser) && !!moveToAlignmentUserId && (
    <div className={classes.tooltipHelp}>
      {hover && <span>Moved to AF by <Components.UsersName documentId={moveToAlignmentUserId }/> on { afDate && moment(new Date(afDate)).format('YYYY-MM-DD') }</span>}
    </div>
  )

  return (
    <span className={classes.vote}>
      {!!af && forumTypeSetting.get() !== 'AlignmentForum' &&
        <Tooltip placement="bottom" title={
          <div>
            <p>AI Alignment Forum Karma</p>
            { moveToAfInfo }
          </div>
        }>
          <span className={voteDimensions.length === 1 ? classes.secondaryScoreExtraMargin : classes.secondaryScore}>
            <span className={classes.secondarySymbol}>Ω</span>
            <span className={classes.secondaryScoreNumber}>{afBaseScore || 0}</span>
          </span>
        </Tooltip>
      }
      <span className={voteDimensions.length > 1 ? classes.secondaryVoteButtonsExtraMargin : {}}>
        <SmallSideVoteSingle
          document={document}
          hideKarma={hideKarma}
          voteDimension="Overall"
          collection={collection}
          voteProps={voteProps}
        />
      </span>
      {voteDimensions.includes('Agreement') &&
        <span className={voteDimensions.length > 1 ? classes.secondaryVoteButtonsExtraMargin : {}}>
          <SmallSideVoteSingle
            document={document}
            hideKarma={hideKarma}
            voteDimension="Agreement"
            collection={collection}
            voteProps={voteProps}
          />
        </span>
      }
    </span>)
}

const SmallSideVoteComponent = registerComponent('SmallSideVote', SmallSideVote, {styles});

declare global {
  interface ComponentTypes {
    SmallSideVote: typeof SmallSideVoteComponent
  }
}

