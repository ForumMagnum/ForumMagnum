import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import { useVote } from './withVote';
import { isAF, isLW } from '../../lib/instanceSettings';
import { useCurrentUser } from '../common/withUser';
import { voteButtonsDisabledForUser } from '../../lib/collections/users/helpers';
import { VotingSystem } from '../../lib/voting/votingSystems';

const styles = (theme: ThemeType) => ({
  voteBlockHorizontal: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    opacity: .76,
    borderRadius: 4,
  },
  upvoteHorizontal: {
    marginBottom: 2,
    '& .VoteArrowIconSolid-root': {
      color: theme.palette.grey[800]
    },
  },
  downvoteHorizontal: {
    '& .VoteArrowIconSolid-root': {
      color: theme.palette.grey[800]
    },
  },
  voteScoresHorizontal: {
    margin: isLW ? '-2px 8px' : '-4px 8px'
  },
  voteScore: {
    color: theme.palette.grey[600],
    fontFamily: theme.palette.fonts.sansSerifStack,
    position: 'relative',
    zIndex: theme.zIndexes.postsVote,
    fontSize: '1rem',
    fontVariantNumeric: 'lining-nums'
  },
  tooltip: {
    color: theme.palette.grey[500],
    fontSize: '1rem',
    backgroundColor: theme.palette.panelBackground.default,
    transition: 'opacity 150ms cubic-bezier(0.4, 0, 1, 1) 0ms',
    marginLeft: 0,
  },
});

const LWPostsPageTopHeaderVote = ({
  post,
  votingSystem,
  classes,
}: {
  post: PostsWithVotes,
  votingSystem: VotingSystem<PostsWithVotes>,
  classes: ClassesType<typeof styles>
}) => {
  const voteProps = useVote(post, "Posts", votingSystem);
  const {OverallVoteButton, Typography} = Components;
  const currentUser = useCurrentUser();

  const {fail, reason: whyYouCantVote} = voteButtonsDisabledForUser(currentUser);
  const canVote = !fail;

  // Can't do top, since in context this always has tags above it
  const tooltipPlacement = 'bottom' as const;

  const tooltipText = <div>
    <div>{`${voteProps.voteCount} ${voteProps.voteCount === 1 ? "vote" : "votes"}`}</div>
    {post.af && !isAF && <div><em>{post.afBaseScore} karma on AlignmentForum</em></div>}
  </div>

  return (
    <div className={classes.voteBlockHorizontal}>
      <Tooltip
        title={whyYouCantVote ?? "Click-and-hold for strong vote (click twice on mobile)"}
        placement={tooltipPlacement}
        classes={{tooltip: classes.tooltip}}
      >
        <div className={classes.upvoteHorizontal}>
          <OverallVoteButton
            orientation="up"
            color="secondary"
            upOrDown="Upvote"
            enabled={canVote}
            solidArrow
            {...voteProps}
          />
        </div>
      </Tooltip>
      <div className={classes.voteScoresHorizontal}>
        <Tooltip
          title={tooltipText}
          placement={tooltipPlacement}
          classes={{tooltip: classes.tooltip}}
        >
          <div>
            {/* Have to make sure to wrap this in a div because Tooltip requires
              * a child that takes refs */}
            <Typography
              variant="headline"
              className={classes.voteScore}
            >
              {voteProps.baseScore}
            </Typography>
          </div>
        </Tooltip>
      </div>
      <Tooltip
        title={whyYouCantVote ?? "Click-and-hold for strong vote (click twice on mobile)"}
        placement={tooltipPlacement}
        classes={{tooltip: classes.tooltip}}
      >
        <div className={classes.downvoteHorizontal}>
          <OverallVoteButton
            orientation="down"
            color="error"
            upOrDown="Downvote"
            enabled={canVote}
            solidArrow
            {...voteProps}
          />
        </div>
      </Tooltip>
    </div>
  );
}

const PostsSplashPageHeaderVoteComponent = registerComponent(
  "LWPostsPageTopHeaderVote",
  LWPostsPageTopHeaderVote,
  {styles},
);

declare global {
  interface ComponentTypes {
    LWPostsPageTopHeaderVote: typeof PostsSplashPageHeaderVoteComponent
  }
}
