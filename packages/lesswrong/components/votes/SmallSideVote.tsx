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

const SmallSideVote = ({ document, hideKarma=false, voteDimensions = ["Overall"], classes, collection }: {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics,
  hideKarma?: boolean,
  voteDimensions?: VoteDimensionString[],
  classes: ClassesType,
  collection: any
}) => {

  const currentUser = useCurrentUser();
  const voteProps = useVote(document, collection.options.collectionName);
  
  if (!document) return null;

  const { SmallSideVoteSingle } = Components

  return (
    <span className={classes.vote}>
      <SmallSideVoteSingle
        document={document}
        hideKarma={hideKarma}
        voteDimension="Overall"
        collection={collection}
        voteProps={voteProps}
      />
      {voteDimensions.includes('Agreement') &&
        <SmallSideVoteSingle
          document={document}
          hideKarma={hideKarma}
          voteDimension="Agreement"
          collection={collection}
          voteProps={voteProps}
        />}
    </span>)
}

const SmallSideVoteComponent = registerComponent('SmallSideVote', SmallSideVote, {styles});

declare global {
  interface ComponentTypes {
    SmallSideVote: typeof SmallSideVoteComponent
  }
}

