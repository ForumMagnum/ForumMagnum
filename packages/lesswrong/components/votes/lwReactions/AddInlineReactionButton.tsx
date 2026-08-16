import React, { useRef, useState } from "react";
import { useNamesAttachedReactionsVoting } from "./NamesAttachedReactionsVoteOnComment";
import { VotingProps } from "../votingProps";
import { QuoteLocator } from "../../../lib/voting/namesAttachedReactions";
import classNames from "classnames";
import LWTooltip from "../../common/LWTooltip";
import ForumIcon from "../../common/ForumIcon";
import ReactionsPalette from "../ReactionsPalette";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const PALETTE_WIDTH = 350;

const styles = defineStyles('AddInlineReactionButton', (theme: ThemeType) => ({
  container: {
    position: "relative",
  },
  tooltip: {
    height: 38,
  },
  icon: {
    color: theme.palette.grey[600],
    borderRadius: 8,
    padding: '7px 8px',
    "&:hover": {
      background: theme.palette.panelBackground.darken08,
    },
    // Icons have 24 px font size; gives it enough room for padding while still maintaing proper icon size
    width: '1.666em',
    height: '1.666em',
    cursor: "pointer",
  },
  disabled: {
    opacity: .25
  },
  palette: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.shadows[2],
    paddingTop: 12,
    maxWidth: `min(${PALETTE_WIDTH}px, calc(100vw - 16px))`,
    position: "absolute",
    left: 0,
    top: -30,
  },
  // Used when there isn't room for the palette to extend rightwards from the
  // button (e.g. on phones, where the button is clamped to the viewport
  // edge). -40 (the icon width) aligns the palette's right edge with the
  // icon's right edge; the container's own inline box ends at the icon's
  // left edge.
  paletteOpenToLeft: {
    left: "auto",
    right: -40,
  }
}))

const AddInlineReactionButton = ({voteProps, quote, disabled, wrapperClassName, iconClassName, paletteClassName}: {
  voteProps: VotingProps<VoteableTypeClient>,
  quote: QuoteLocator|null,
  disabled?: boolean,
  wrapperClassName?: string,
  iconClassName?: string,
  paletteClassName?: string,
}) => {
  const classes = useStyles(styles);
  const [open,setOpen] = useState(false);
  const [openToLeft,setOpenToLeft] = useState(false);
  const buttonRef = useRef<HTMLElement|null>(null);
  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) {
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      setOpenToLeft(!!buttonRect && buttonRect.left + PALETTE_WIDTH > window.innerWidth)
      setOpen(true)
    }
  }

  const handleToggleReaction = (reaction: string, quote: QuoteLocator) => {
    setOpen(false)
    toggleReaction(reaction, quote)
  }

  return <span className={classNames(classes.container, wrapperClassName)}>
    <LWTooltip
      disabled={open}
      title={<div><p>Click to react to the selected text</p>
        {disabled && <p><em>You need to select a unique snippet.<br/>Please select more text until the snippet is unique</em></p>}
      </div>}
      className={classes.tooltip}
    >
      <span
        ref={buttonRef}
      >
        {/* This needs to trigger on mouse down, not on click, because in Safari
          * (specifically), clicking outside of a text selection deselects on
          * press, which makes the button disappear.
          */}
        {!open && <ForumIcon icon="AddReaction" onMouseDown={handleOpen} className={classNames(classes.icon, { [classes.disabled]: disabled }, iconClassName)}/>}
      </span>
    </LWTooltip>
    {open && <div className={classNames(classes.palette, openToLeft && classes.paletteOpenToLeft, paletteClassName)}>
      <ReactionsPalette
        getCurrentUserReactionVote={getCurrentUserReactionVote}
        toggleReaction={handleToggleReaction}
        quote={quote} 
      />
    </div>}
  </span>
}

export default AddInlineReactionButton;


