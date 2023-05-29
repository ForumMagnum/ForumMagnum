import React, { useEffect, useRef, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { VotingProps } from "../withVote";
import InsertEmoticonOutlined from '@material-ui/icons/InsertEmoticon';
import { useNamesAttachedReactionsVoting } from "../NamesAttachedReactionsVoteOnComment";
import Mark from 'mark.js';
import { hideSelectorClassName } from "../../common/InlineReactSelectionWrapper";

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

const AddInlineReactionButton = ({voteProps, classes, quote, documentRef, plaintext}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  quote?: string,
  documentRef: React.RefObject<HTMLDivElement>,
  plaintext?: string,
}) => {
  const [open,setOpen] = useState(false);
  const buttonRef = useRef<HTMLElement|null>(null);
  const { LWTooltip, ReactionsPalette } = Components;
  const [disabled, setDisabled] = useState(formIsDisabled(plaintext ?? "", quote ?? ""));

  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);

  useEffect(() => {
    setDisabled(formIsDisabled(plaintext ?? "", quote ?? ""))
  }, [plaintext, quote])

  // ideally, I'd just use mark.js to check if the quote is unique, 
  // but it was creating annoying bugs with the original text-selection highlight.
  // I'm not 100% sure regexes on the plaintext will be identical to what mark.js detects,
  // but for now I'm just checking twice to be sure:
  //  – once when the user changes their selection, and again when they go to click the button.
  function formIsDisabled(string: string, substring: string): boolean {
    if (!string || !substring) return true
    const regex = new RegExp(substring, 'g');
    const matches = string.match(regex);
    if (!matches) return true
    return matches && matches.length !== 1;
  }

  // while moused over the button, if the text appears multiple times it highlights both of 
  // them so it's easier to figure out the minimal text to highlight
  function handleHover() {
    const ref = documentRef.current
    if (!ref) return
    let markInstance = new Mark(ref);
    markInstance.unmark({className: hideSelectorClassName});
    let count = 0
    markInstance.mark(quote ?? "", {
      separateWordSearch: false,
      acrossElements: true,
      diacritics: true,
      className: hideSelectorClassName,
      each: (node) => {
        count += 1
      }
    });
    if (count !== 1) {
      setDisabled(true)
    } else {
      setDisabled(false)
    }
  }

  function handleHoverEnd() {
    const ref = documentRef.current
    if (!ref) return
    let markInstance = new Mark(ref);
    markInstance.unmark({className: hideSelectorClassName});
  }

  const handleOpen = () => {
    !disabled && setOpen(true)
  }

  return <LWTooltip
    disabled={open}
    inlineBlock={false}
    title={<div><p>Click to react to this comment snippet</p>
      {disabled && <p><em>You need to select a unique snippet. Please select more text until the snippet is unique</em></p>}
    </div>}
  >
    <span
      ref={buttonRef}
    >
      {!open && <InsertEmoticonOutlined onClick={handleOpen} onMouseOver={handleHover} onMouseLeave={handleHoverEnd} className={disabled ? classes.disabled : null}/>}
      {open && <div className={classes.palette}>
        <ReactionsPalette
          getCurrentUserReactionVote={getCurrentUserReactionVote}
          toggleReaction={toggleReaction}
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
