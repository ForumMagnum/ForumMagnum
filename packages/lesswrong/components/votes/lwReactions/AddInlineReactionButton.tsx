import React, { useRef, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { VotingProps } from "../withVote";
import InsertEmoticonOutlined from '@material-ui/icons/InsertEmoticon';
import { useNamesAttachedReactionsVoting } from "../NamesAttachedReactionsVoteOnComment";
import { getVotingSystemByName } from "../../../lib/voting/votingSystems";

const styles = (theme: ThemeType): JssStyles => ({
  AddInlineReactionButton: {
    // "& svg": {
    //   width: 24,
    //   height: 24,
    //   position: "relative",
    //   filter: "opacity(0.4)",
    //   top: 2,
    //   verticalAlign: "bottom",
    //   marginLeft: 11,
    //   cursor: "pointer",
    // },
    // "&:hover": {
    //   filter: "opacity(0.8)",
    // },
  },
  palette: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.shadows[2],
    paddingTop: 12,
    maxWidth: 350,
  }
})

const AddInlineReactionButton = ({voteProps, classes, quote}: {
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  quote?: string,
}) => {
  const [open,setOpen] = useState(false);
  const buttonRef = useRef<HTMLElement|null>(null);
  const { PopperCard, LWClickAwayListener, LWTooltip, ReactionsPalette } = Components;

  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);

  return <LWTooltip
    disabled={open}
    inlineBlock={false}
    title={<>Click to react to this comment</>}
  >
    <span
      ref={buttonRef}
      className={classes.AddInlineReactionButton}
    >
      {!open && <InsertEmoticonOutlined onClick={ev => setOpen(true)}/>}
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
