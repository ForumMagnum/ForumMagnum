import React, { MouseEvent, useState, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import {
  CommentVotingComponentProps,
  getVotingSystemByName,
} from "../../lib/voting/votingSystems";
import { useVote, VotingProps } from "./withVote";
import { useTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from "../common/withUser";
import { useDialog } from "../common/withDialog";
import { AddEmoji } from "../icons/addEmoji";
import { eaEmojiPalette, EmojiOption } from "../../lib/voting/eaEmojiPalette";
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
    gap: "6px",
    height: 26,
    transform: "translateY(-1px)",
    cursor: "pointer",
    userSelect: "none",
    "&:hover": {
      background: theme.palette.grey[200],
    },
  },
  emojiPreview: {
    fontSize: "1.4em",
  },
  tooltip: {
    background: theme.palette.grey[800],
    color: theme.palette.grey[0],
    transform: "translateY(-8px)",
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

const isEmojiSelected = <T extends VoteableTypeClient>(
  voteProps: VotingProps<T>,
  emojiOption: EmojiOption,
) => Boolean(voteProps.document?.currentUserExtendedVote?.[emojiOption.name]);

const getCurrentReactions = <T extends VoteableTypeClient>(
  voteProps: VotingProps<T>,
) => {
  const extendedScore = voteProps.document?.extendedScore;
  if (!extendedScore || !Object.keys(extendedScore).length) {
    return [];
  }

  const result = [];
  for (const emojiOption of eaEmojiPalette) {
    if ((extendedScore[emojiOption.name] ?? 0) > 0) {
      result.push({
        emojiOption,
        score: extendedScore[emojiOption.name],
      });
    }
  }
  return result;
}

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
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [everOpened, setEverOpened] = useState(false);
  const {captureEvent} = useTracking({
    eventType: "emojiMenuClicked",
    eventProps: {documentId: document._id, itemType: "comment"},
  });

  const voteProps = useVote(
    document,
    collection.options.collectionName,
    votingSystem,
  );

  const onOpenMenu = useCallback((event: MouseEvent) => {
    captureEvent("emojiMenuClicked", {open: true});
    setAnchorEl(event.currentTarget as HTMLElement);
    setEverOpened(true);
  }, [captureEvent]);

  const onCloseMenu = useCallback(() => {
    captureEvent("emojiMenuClicked", {open: false});
    setAnchorEl(null);
  }, [captureEvent]);

  const onSelectEmoji = useCallback((emojiOption: EmojiOption) => {
    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {},
      });
      return;
    }

    voteProps.vote({
      document: voteProps.document,
      voteType: voteProps.document.currentUserVote || null,
      extendedVote: {
        ...voteProps.document.currentUserExtendedVote,
        [emojiOption.name]: !isEmojiSelected(voteProps, emojiOption),
      },
      currentUser,
    });
  }, [currentUser, openDialog, voteProps]);

  const reactions = getCurrentReactions(voteProps);

  const {TwoAxisVoteOnComment, EAEmojiPalette, LWTooltip} = Components;
  return (
    <div className={classes.root}>
      <TwoAxisVoteOnComment
        document={document}
        hideKarma={hideKarma}
        collection={collection}
        votingSystem={getVotingSystemByName("twoAxis")}
      />
      {reactions.map(({emojiOption, score}) =>
        <LWTooltip
          key={emojiOption.name}
          title={`${emojiOption.emoji} ${emojiOption.label}`}
          placement="top"
          popperClassName={classes.tooltip}
        >
          <div
            role="button"
            onClick={() => onSelectEmoji(emojiOption)}
            className={classes.button}
          >
            <div className={classes.emojiPreview}>{emojiOption.emoji}</div>
            <div>{score}</div>
          </div>
        </LWTooltip>
      )}
      <div
        role="button"
        onClick={onOpenMenu}
        className={classes.button}
      >
        <LWTooltip
          title="Add reaction"
          placement="top"
          popperClassName={classes.tooltip}
        >
          <AddEmoji />
        </LWTooltip>
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
        {everOpened && <EAEmojiPalette onSelectEmoji={onSelectEmoji} />}
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
