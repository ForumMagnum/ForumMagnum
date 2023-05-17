import React, { MouseEvent, useState, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { CommentVotingComponentProps, getVotingSystemByName } from "../../lib/voting/votingSystems";
// import { useVote } from "./withVote";
import { AddEmoji } from "../icons/addEmoji";
import { useTracking } from "../../lib/analyticsEvents";
import Menu from "@material-ui/core/Menu";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    gap: "10px",
  },
  button: {
    display: "flex",
    alignItems: "center",
    borderRadius: theme.borderRadius.small,
    background: theme.palette.grey[110],
    color: theme.palette.grey[600],
    padding: "0 6px",
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.grey[200],
    },
  },
  menu: {
    "& .MuiPaper-root": {
      transform: "translateY(-8px) !important",
    },
    "& .MuiList-padding": {
      padding: 0,
    },
  },
});

interface ThreeAxisEmojisVoteOnCommentProps extends CommentVotingComponentProps {
  classes: ClassesType,
}

const ThreeAxisEmojisVoteOnComment = ({
  document,
  hideKarma = false,
  collection,
  votingSystem,
  classes,
}: ThreeAxisEmojisVoteOnCommentProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [everOpened, setEverOpened] = useState(false);
  const {captureEvent} = useTracking({
    eventType: "emojiMenuClicked",
    eventProps: {documentId: document._id, itemType: "comment"},
  });

  const onOpenMenu = useCallback((event: MouseEvent) => {
    captureEvent("emojiMenuClicked", {open: true});
    setAnchorEl(event.currentTarget as HTMLElement);
    setEverOpened(true);
  }, []);

  const onCloseMenu = useCallback(() => {
    captureEvent("emojiMenuClicked", {open: false});
    setAnchorEl(null);
  }, []);

  // const voteProps = useVote(
    // document,
    // collection.options.collectionName,
    // votingSystem,
  // );

  const {TwoAxisVoteOnComment, EAEmojiPalette} = Components;
  return (
    <div className={classes.root}>
      <TwoAxisVoteOnComment
        document={document}
        hideKarma={hideKarma}
        collection={collection}
        votingSystem={getVotingSystemByName("twoAxis")}
      />
      <div
        role="button"
        onClick={onOpenMenu}
        className={classes.button}
      >
        <AddEmoji />
      </div>
      <Menu
        onClick={onCloseMenu}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        className={classes.menu}
      >
        {everOpened && <EAEmojiPalette />}
      </Menu>
    </div>
  );
}

const ThreeAxisEmojisVoteOnCommentComponent = registerComponent(
  "ThreeAxisEmojisVoteOnComment",
  ThreeAxisEmojisVoteOnComment,
  {styles},
);

declare global {
  interface ComponentTypes {
    ThreeAxisEmojisVoteOnComment: typeof ThreeAxisEmojisVoteOnCommentComponent
  }
}
