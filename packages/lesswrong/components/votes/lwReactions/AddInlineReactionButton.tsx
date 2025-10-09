import React from "react";
import { useNamesAttachedReactionsVoting } from "./NamesAttachedReactionsVoteOnComment";
import { VotingProps } from "../votingProps";
import { QuoteLocator, userCanAddNewReacts } from "../../../lib/voting/namesAttachedReactions";
import classNames from "classnames";
import ForumIcon from "../../common/ForumIcon";
import ReactionsPalette from "../ReactionsPalette";
import { defineStyles } from "@/components/hooks/defineStyles";
import { useStyles } from "@/components/hooks/useStyles";
import { TooltipSpan } from "@/components/common/FMTooltip";
import { useCurrentUser } from "@/components/common/withUser";
import { addNewReactKarmaThreshold } from "@/lib/instanceSettings";

const styles = defineStyles("AddInlineReactionButton", (theme: ThemeType) => ({
  tooltip: {
    display: "inline-block",
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
}))

export const AddInlineReactionButton = ({onClick, className, quoteIsNotDistinct}: {
  onClick: () => void,
  className?: string,
  quoteIsNotDistinct?: boolean
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const sufficientKarma = userCanAddNewReacts(currentUser)
  
  // We don't disable the button for logged-out and insufficient-karma users, because we want you to still be able to browse the reactions palette.
  const disabled = quoteIsNotDistinct;

  return <TooltipSpan
    title={<div><p>Click to react to the selected text</p>
      {!currentUser && <p>You must be logged in to leave inline reactions.</p>}
      {currentUser && !sufficientKarma && <p>You need at least {addNewReactKarmaThreshold.get()} karma to leave inline reacts.</p>}
      {quoteIsNotDistinct && <p><em>You need to select a unique snippet.<br/>Please select more text until the snippet is unique</em></p>}
    </div>}
    className={classes.tooltip}
  >
    {/* This needs to trigger on mouse down, not on click, because in Safari
      * (specifically), clicking outside of a text selection deselects on
      * press, which makes the button disappear.
      */}
    <ForumIcon icon="AddReaction"
      onMouseDown={disabled ? onClick : undefined}
      className={classNames(classes.icon, disabled && classes.disabled, className)}
    />
  </TooltipSpan>
}

export const AddInlineReactionDialog = ({voteProps, quote, onClose}: {
  voteProps: VotingProps<VoteableTypeClient>,
  quote: QuoteLocator|null,
  onClose: () => void
}) => {
  const classes = useStyles(styles);
  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);

  const handleToggleReaction = (reaction: string, quote: QuoteLocator) => {
    onClose();
    toggleReaction(reaction, quote)
  }
  return <div className={classes.palette}>
    <ReactionsPalette
      getCurrentUserReactionVote={getCurrentUserReactionVote}
      toggleReaction={handleToggleReaction}
      quote={quote}
    />
  </div>
}
