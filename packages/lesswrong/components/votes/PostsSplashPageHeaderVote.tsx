import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import { useVote } from './withVote';
import { isAF } from '../../lib/instanceSettings';
import { useCurrentUser } from '../common/withUser';
import { voteButtonsDisabledForUser } from '../../lib/collections/users/helpers';
import { VotingSystem } from '../../lib/voting/votingSystems';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  voteBlockHorizontal: {
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    alignItems: 'center',
    background: theme.palette.grey[200],
    opacity: .76,
    borderRadius: 4
  },
  upvoteHorizontal: {
    paddingRight: 6,
    '& .VoteArrowIcon-root': {
      color: theme.palette.grey[800]
    },
  },
  downvoteHorizontal: {
    paddingLeft: 6,
    '& .VoteArrowIcon-root': {
      color: theme.palette.grey[800]
    },
  },
  voteScoresHorizontal: {
    marginLeft: 8,
    marginRight: 8,
  },
  voteScore: {
    color: theme.palette.grey[600],
    fontFamily: theme.palette.fonts.sansSerifStack,
    position: 'relative',
    zIndex: theme.zIndexes.postsVote,
    fontSize: '80%',
  },
  voteScoreFooter: {
    fontSize: 18,
    fontWeight: 500,
  },
  voteScoreGoodHeart: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    fontSize: '45%',
    textAlign: "center",
  },
  secondaryVoteScore: {
    fontSize: '35%',
    marginBottom: 2,
  },
  tooltip: {
    color: theme.palette.grey[500],
    fontSize: '1rem',
    backgroundColor: theme.palette.panelBackground.default,
    transition: 'opacity 150ms cubic-bezier(0.4, 0, 1, 1) 0ms',
    marginLeft: 0,
  },
});

const PostsSplashPageHeaderVote = ({
  post,
  useHorizontalLayout,
  votingSystem,
  isFooter,
  classes,
}: {
  post: PostsWithVotes,
  /** if true, display the vote arrows to the left & right of the score */
  useHorizontalLayout?: boolean,
  votingSystem?: VotingSystem<PostsWithVotes>,
  isFooter?: boolean,
  classes: ClassesType<typeof styles>
}) => {
  const voteProps = useVote(post, "Posts", votingSystem);
  const {OverallVoteButton, Typography} = Components;
  const currentUser = useCurrentUser();

  const {fail, reason: whyYouCantVote} = voteButtonsDisabledForUser(currentUser);
  const canVote = !fail;

  // TODO: should this always be bottom?  Can't do top, since in context this always has tags above it
  const tooltipPlacement = 'bottom' as const;

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
            {...voteProps}
          />
        </div>
      </Tooltip>
      <div className={classes.voteScoresHorizontal}>
        <Tooltip
          title={`${voteProps.voteCount} ${voteProps.voteCount === 1 ? "Vote" : "Votes"}`}
          placement={tooltipPlacement}
          classes={{tooltip: classes.tooltip}}
        >
          <div>
            {/* Have to make sure to wrap this in a div because Tooltip requires
              * a child that takes refs */}
            <Typography
              variant="headline"
              className={classNames(classes.voteScore, {
                [classes.voteScoreFooter]: isFooter,
              })}
            >
              {voteProps.baseScore}
            </Typography>
          </div>
        </Tooltip>

        {!!post.af && !!post.afBaseScore && !isAF &&
          <Tooltip
            title="AI Alignment Forum karma"
            placement={tooltipPlacement}
            classes={{tooltip: classes.tooltip}}
          >
            <Typography
              variant="headline"
              className={classNames(classes.voteScore, classes.secondaryVoteScore, {
                [classes.voteScoreFooter]: isFooter,
              })}>
              Ω {post.afBaseScore}
            </Typography>
          </Tooltip>
        }
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
            {...voteProps}
          />
        </div>
      </Tooltip>
    </div>
  );
}

const PostsSplashPageHeaderVoteComponent = registerComponent(
  "PostsSplashPageHeaderVote",
  PostsSplashPageHeaderVote,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostsSplashPageHeaderVote: typeof PostsSplashPageHeaderVoteComponent
  }
}
