import React, { useRef, useState } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useNamesAttachedReactionsVoting } from "./NamesAttachedReactionsVoteOnComment";
import { VotingProps } from "../votingProps";
import { QuoteLocator } from "../../../lib/voting/namesAttachedReactions";
import classNames from "classnames";
import { LWTooltip } from "../../common/LWTooltip";
import { ForumIcon } from "../../common/ForumIcon";
import { ReactionsPalette } from "../ReactionsPalette";

const styles = (theme: ThemeType) => ({
  tooltip: {
    height: 38,
  },
  icon: {
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
    maxWidth: 350,
  }
})

const AddInlineReactionButtonInner = ({voteProps, classes, quote, disabled}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
  quote: QuoteLocator|null,
  disabled?: boolean
}) => {
  const [open,setOpen] = useState(false);
  const buttonRef = useRef<HTMLElement|null>(null);
  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);
  
  const handleOpen = (e: React.MouseEvent) => {
    if (!disabled) {
      setOpen(true)
    }
  }

  const handleToggleReaction = (reaction: string, quote: QuoteLocator) => {
    setOpen(false)
    toggleReaction(reaction, quote)
  }

  return <LWTooltip
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
      {!open && <ForumIcon icon="AddReaction" onMouseDown={handleOpen} className={classNames(classes.icon, { [classes.disabled]: disabled })}/>}
      {open && <div className={classes.palette}>
        <ReactionsPalette
          getCurrentUserReactionVote={getCurrentUserReactionVote}
          toggleReaction={handleToggleReaction}
          quote={quote} 
        />
      </div>}
    </span>
  </LWTooltip>
}

export const AddInlineReactionButton = registerComponent('AddInlineReactionButton', AddInlineReactionButtonInner, {styles});

declare global {
  interface ComponentTypes {
    AddInlineReactionButton: typeof AddInlineReactionButton
  }
}
