import React, { useState, useRef } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';
import { useTracking } from "../../lib/analyticsEvents";
import { useNamesAttachedReactionsVoting } from './lwReactions/NamesAttachedReactionsVoteOnComment';
import { VotingProps } from './votingProps';
import LWTooltip from "../common/LWTooltip";
import PopperCard from "../common/PopperCard";
import LWClickAwayListener from "../common/LWClickAwayListener";
import UltraFeedReactionsPalette from './UltraFeedReactionsPalette';
import { AddReactionIcon } from '../icons/AddReactionIcon';

const styles = defineStyles('UltraFeedAddReactionButton', (theme: ThemeType) => ({
  addReactionButton: {
    marginLeft: 12,
    opacity: 0.7,
    position: "relative",
    top: 0,
    color: `${theme.palette.ultraFeed.dim} !important`,
    display: 'flex',
    marginRight: 6,
    alignItems: 'center',
    cursor: 'pointer',
    '& .react-hover-style': {
      filter: 'opacity(1) !important',
    },
    '& svg': {
      filter: 'opacity(1) !important',
      height: 16,
      width: 16,
      [theme.breakpoints.down('sm')]: {
        height: 21,
        width: 21,
      },
    },
    '&:hover': {
      opacity: 1,
    },
    [theme.breakpoints.down('sm')]: {
      opacity: 1,
      marginLeft: 6,
      top: 0,
    }
  },
  hideOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  hoverBallot: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    paddingTop: 12,
    width: 300,
  },
}));

const UltraFeedAddReactionButton = ({voteProps, hideOnMobileIfReactions}: {
  voteProps: VotingProps<VoteableTypeClient>,
  hideOnMobileIfReactions?: boolean,
}) => {
  const classes = useStyles(styles);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLElement|null>(null);
  const { captureEvent } = useTracking();

  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);

  const handleToggleReaction = (name: string, quote: string) => {
    setOpen(false)
    toggleReaction(name, quote)
  }

  return <LWTooltip
    disabled={open}
    inlineBlock={false}
    title={<>Add reaction</>}
  >
    <span
      ref={buttonRef}
      onClick={ev => {
        setOpen(true)
        !open && captureEvent("ultraFeedReactPaletteOpened", {open: true})
      }}
      className={classNames(
        classes.addReactionButton, 
        "react-hover-style",
        { [classes.hideOnMobile]: hideOnMobileIfReactions }
      )}
    >
      <AddReactionIcon />
      <PopperCard
        open={open} 
        anchorEl={buttonRef.current}
        placement="bottom-end"
        allowOverflow={true}
      >
        <LWClickAwayListener onClickAway={() => {
          setOpen(false)
          captureEvent("ultraFeedReactPaletteClosed", {open: false})
        }}>
          <div className={classes.hoverBallot}>
            <UltraFeedReactionsPalette
              quote={null}
              getCurrentUserReactionVote={getCurrentUserReactionVote}
              toggleReaction={handleToggleReaction}
            />
          </div>
        </LWClickAwayListener>
      </PopperCard>
    </span>
  </LWTooltip>
}

export default UltraFeedAddReactionButton;
