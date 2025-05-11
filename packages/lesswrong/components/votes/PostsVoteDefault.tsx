import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { Ref } from 'react';
import classNames from 'classnames';
import { useVote } from './withVote';
import { isAF, isLW } from '../../lib/instanceSettings';
import { useCurrentUser } from '../common/withUser';
import { voteButtonsDisabledForUser } from '../../lib/collections/users/helpers';
import { VotingSystem } from '../../lib/voting/votingSystems';
import { isFriendlyUI } from '../../themes/forumTheme';
import { TooltipRef, TooltipSpan } from '../common/FMTooltip';
import OverallVoteButton from "./OverallVoteButton";
import { Typography } from "../common/Typography";

const styles = (theme: ThemeType) => ({
  voteBlock: {
    width: 50,
  },
  voteBlockHorizontal: {
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  upvote: {
    marginBottom: -21
  },
  upvoteHorizontal: {
    marginTop: -8
  },
  downvote: {
    marginTop: -28
  },
  downvoteHorizontal: {
    marginTop: -6
  },
  voteScores: {
    margin:"15%",
    
    ...(isLW && {
      margin: "25% 15% 15% 15%"
    }),
    ...(isAF && {
      fontVariantNumeric: "lining-nums",
    }),
  },
  voteScoresHorizontal: {
    margin: '0 12px'
  },
  voteScore: {
    color: isFriendlyUI ? theme.palette.grey[600] : theme.palette.grey[500],
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
    position: 'relative',
    zIndex: theme.zIndexes.postsVote,
    fontSize: isFriendlyUI ? '50%' : '55%',
    
    ...(isFriendlyUI && {
      paddingTop:4,
      paddingBottom:2,
      paddingLeft:1,
      paddingRight:0,
      fontSize: '50%',
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
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
    paddingTop: isFriendlyUI ? 12 : 0
  },
});

const PostsVoteDefault = ({
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
  const currentUser = useCurrentUser();

  const {fail, reason: whyYouCantVote} = voteButtonsDisabledForUser(currentUser);
  const canVote = !fail;

  let tooltipPlacement: "left"|"right"|"top" = isFriendlyUI ? "left" : "right";
  if (useHorizontalLayout) {
    tooltipPlacement = "top";
  }

  return (
    <div className={classNames({
      [classes.voteBlock]: !useHorizontalLayout,
      [classes.voteBlockHorizontal]: useHorizontalLayout,
    })}>
      <TooltipRef
        title={whyYouCantVote ?? "Click-and-hold for strong vote (click twice on mobile)"}
        placement={tooltipPlacement}
        popperClassName={classes.tooltip}
      >
        {(ref: Ref<HTMLDivElement>) => <div ref={ref}className={classNames({
          [classes.upvote]: !useHorizontalLayout,
          [classes.upvoteHorizontal]: useHorizontalLayout,
        })}>
          <OverallVoteButton
            orientation="up"
            color="secondary"
            upOrDown="Upvote"
            enabled={canVote}
            {...voteProps}
          />
        </div>}
      </TooltipRef>
      <div className={classNames({
        [classes.voteScores]: !useHorizontalLayout,
        [classes.voteScoresHorizontal]: useHorizontalLayout,
      })}>
        <TooltipSpan
          title={`${voteProps.voteCount} ${voteProps.voteCount === 1 ? "Vote" : "Votes"}`}
          placement={tooltipPlacement}
          popperClassName={classes.tooltip}
        >
          <Typography
            variant="headline"
            className={classNames(classes.voteScore, {
              [classes.voteScoreFooter]: isFooter,
            })}
          >
            {voteProps.baseScore}
          </Typography>
        </TooltipSpan>

        {!!post.af && !!post.afBaseScore && !isAF &&
          <TooltipSpan
            title="AI Alignment Forum karma"
            placement={tooltipPlacement}
            popperClassName={classes.tooltip}
          >
            <Typography
              variant="headline"
              className={classNames(classes.voteScore, classes.secondaryVoteScore, {
                [classes.voteScoreFooter]: isFooter,
              })}>
              Ω {post.afBaseScore}
            </Typography>
          </TooltipSpan>
        }
      </div>
      <TooltipRef
        title={whyYouCantVote ?? "Click-and-hold for strong vote (click twice on mobile)"}
        placement={tooltipPlacement}
        popperClassName={classes.tooltip}
      >
        {(ref: Ref<HTMLDivElement>) => <div ref={ref} className={classNames({
          [classes.downvote]: !useHorizontalLayout,
          [classes.downvoteHorizontal]: useHorizontalLayout,
        })}>
          <OverallVoteButton
            orientation="down"
            color="error"
            upOrDown="Downvote"
            enabled={canVote}
            {...voteProps}
          />
        </div>}
      </TooltipRef>
    </div>
  );
}

export default registerComponent(
  "PostsVoteDefault",
  PostsVoteDefault,
  {styles},
);


