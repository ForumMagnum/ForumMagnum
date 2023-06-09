import React, { useRef, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { VotingProps } from "../withVote";
import InsertEmoticonOutlined from '@material-ui/icons/InsertEmoticon';
import { useNamesAttachedReactionsVoting } from "./NamesAttachedReactionsVoteOnComment";
import Mark from 'mark.js';
import { hideSelectorClassName } from "./InlineReactSelectionWrapper";

const styles = (theme: ThemeType): JssStyles => ({
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

const AddInlineReactionButton = ({voteProps, classes, quote, commentItemRef}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  quote?: string,
  commentItemRef?: React.RefObject<HTMLDivElement>|null
}) => {
  const [open,setOpen] = useState(false);
  const buttonRef = useRef<HTMLElement|null>(null);
  const { LWTooltip, ReactionsPalette } = Components;
  const [disabled, setDisabled] = useState(false);

  const { getCurrentUserReactionVote, toggleReaction, getCurrentUserReaction } = useNamesAttachedReactionsVoting(voteProps);
  
  // while moused over the button, if the text appears multiple times it highlights both of 
  // them so it's easier to figure out the minimal text to highlight
  function handleHover() {
    const ref = commentItemRef?.current
    if (!ref) return
    let markInstance = new Mark(ref);

    // Extract the raw text content of the entire HTML document
    let rawText = ref.textContent ?? ""

    // Count the number of occurrences of the quote in the raw text
    let count = (rawText.match(new RegExp(quote ?? "", "g")) || []).length;

    markInstance.unmark({className: hideSelectorClassName});
    markInstance.mark(quote ?? "", {
        separateWordSearch: false,
        acrossElements: true,
        diacritics: true,
        className: hideSelectorClassName
    });
    setDisabled(count > 1)
  }

  const handleHoverEnd = () => {
    const ref = commentItemRef?.current
    if (!ref) return
    let markInstance = new Mark(ref);
    markInstance.unmark({className: hideSelectorClassName});
  }

  const handleOpen = () => {
    !disabled && setOpen(true)
  }

  const handleToggleReaction = (reaction: string, quote: string) => {
    setOpen(false)
    toggleReaction(reaction, quote)
  }

  return <LWTooltip
    disabled={open}
    inlineBlock={false}
    title={<div><p>Click to react to this comment snippet</p>
      {disabled && <p><em>You need to select a unique snippet.<br/>Please select more text until the snippet is unique</em></p>}
    </div>}
  >
    <span
      ref={buttonRef}
    >
      {!open && <InsertEmoticonOutlined onClick={handleOpen} onMouseOver={handleHover} onMouseLeave={handleHoverEnd}/>}
      {open && <div className={classes.palette}>
        <ReactionsPalette
          getCurrentUserReaction={getCurrentUserReaction}
          getCurrentUserReactionVote={getCurrentUserReactionVote}
          toggleReaction={handleToggleReaction}
          quote={quote} 
        />
      </div>}
    </span>
  </LWTooltip>
}

const AddInlineReactionButtonComponent = registerComponent('AddInlineReactionButton', AddInlineReactionButton, {styles});

declare global {
  interface ComponentTypes {
    AddInlineReactionButton: typeof AddInlineReactionButtonComponent
  }
}
