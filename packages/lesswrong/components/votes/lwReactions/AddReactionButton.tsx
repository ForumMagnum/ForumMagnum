import React, { useRef, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { VotingProps } from "../withVote";
import InsertEmoticonOutlined from '@material-ui/icons/InsertEmoticon';
import { useNamesAttachedReactionsVoting } from "../NamesAttachedReactionsVoteOnComment";
import { getVotingSystemByName } from "../../../lib/voting/votingSystems";

const styles = (theme: ThemeType): JssStyles => ({
  addReactionButton: {
    verticalAlign: "bottom",
    marginLeft: 11,
    filter: "opacity(0.2)",
    cursor: "pointer",
    "& svg": {
      width: 16,
      height: 16,
      position: "relative",
      top: 2
    },
    "&:hover": {
      filter: "opacity(0.8)",
    },
  },
  palette: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    paddingTop: 12,
    maxWidth: 350,
  }
})

const AddReactionButton = ({voteProps, classes, quote}: {
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
      onClick={ev => setOpen(true)}
      className={classes.addReactionButton}
    >
      <InsertEmoticonOutlined/>
  
      {open && <LWClickAwayListener onClickAway={() => setOpen(false)}>
        <PopperCard
          open={open} anchorEl={buttonRef.current}
          placement="bottom-end"
          allowOverflow={true}
          
        >
          <div className={classes.palette}>
            <ReactionsPalette
              getCurrentUserReactionVote={getCurrentUserReactionVote}
              toggleReaction={toggleReaction}
              quote={quote} 
            />
          </div>
        </PopperCard>
      </LWClickAwayListener>}
    </span>
  </LWTooltip>
}

const AddReactionButtonComponent = registerComponent('AddReactionButton', AddReactionButton, {styles});

declare global {
  interface ComponentTypes {
    AddReactionButton: typeof AddReactionButtonComponent
  }
}
