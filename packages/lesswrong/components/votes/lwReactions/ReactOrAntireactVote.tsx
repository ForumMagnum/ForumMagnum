import React from 'react';
import { QuoteLocator, VoteOnReactionType } from '../../../lib/voting/namesAttachedReactions';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import UpArrowIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowUp';

const styles = (theme: ThemeType) => ({
  reactOrAntireact: {
    width: 55
  },
  reactionVoteCount: {
    display: "inline-block",
    verticalAlign: "middle",
  },
  voteArrow: {
    color: theme.palette.grey[400],
  },
  voteArrowIcon: {
    fontSize: 'inherit',
    padding: 0,
    width: 24,
    height: 24,
    verticalAlign: "middle",
    cursor: 'pointer'
  },
  voteArrowLeft: {
    transform: 'rotate(-90deg)',
    marginRight: -4,
  },
  voteArrowRight: {
    transform: 'rotate(-270deg)',
    marginLeft: -4,
  },
  colorRed: {
    color: theme.palette.error.main,
  },
  colorGreen: {
    color: theme.palette.primary.main,
  },
})

const ReactOrAntireactVote = ({reactionName, quote, netReactionCount, currentUserReaction, setCurrentUserReaction, classes}: {
  reactionName: string
  quote: QuoteLocator|null,
  netReactionCount: number
  currentUserReaction: VoteOnReactionType|null
  setCurrentUserReaction: (reactionName: string, reaction: VoteOnReactionType|null, quote: QuoteLocator|null) => void
  classes: ClassesType<typeof styles>
}) => {
  const onClick = (reaction: "reacted"|"disagreed") => {
    if (reaction === "reacted") {
      if (currentUserReaction === "created" || currentUserReaction === "seconded") {
        setCurrentUserReaction(reactionName, null, quote);
      } else {
        setCurrentUserReaction(reactionName, "seconded", quote);
      }
    } else {
      if (currentUserReaction === "disagreed") {
        setCurrentUserReaction(reactionName, null, quote);
      } else {
        setCurrentUserReaction(reactionName, "disagreed", quote);
      }
    }
  }

  return <div className={classes.reactOrAntireact}>
    <ReactionVoteArrow
      orientation="left"
      onClick={() => onClick("disagreed")}
      classes={classes}
      className={currentUserReaction==="disagreed" ? classes.colorRed : undefined}
    />
    <span className={classes.reactionVoteCount}>
      {netReactionCount}
    </span>
    <ReactionVoteArrow
      orientation="right"
      onClick={() => onClick("reacted")}
      classes={classes}
      className={(currentUserReaction==="created"||currentUserReaction==="seconded") ? classes.colorGreen : undefined}
    />
  </div>
}

const ReactionVoteArrow = ({orientation, onClick, className, classes}: {
  orientation: "left"|"right",
  onClick: () => void,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return <span className={classes.voteArrow}>
    <UpArrowIcon
      onClick={onClick}
      className={classNames(
        className,
        classes.voteArrowIcon,
        {
          [classes.voteArrowLeft]: orientation==="left",
          [classes.voteArrowRight]: orientation==="right",
        },
      )}
    />
  </span>
}


const ReactOrAntireactVoteComponent = registerComponent('ReactOrAntireactVote', ReactOrAntireactVote, {styles});

declare global {
  interface ComponentTypes {
    ReactOrAntireactVote: typeof ReactOrAntireactVoteComponent
  }
}

