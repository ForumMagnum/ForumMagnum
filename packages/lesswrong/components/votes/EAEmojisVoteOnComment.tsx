import React, { FC, MouseEvent, useState, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { CommentVotingComponentProps } from "../../lib/voting/votingSystems";
import { useVote } from "./withVote";
import { usePostsPageContext } from "../posts/PostsPage/PostsPageContext";
import { useTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from "../common/withUser";
import { useDialog } from "../common/withDialog";
import {
  eaAnonymousEmojiPalette,
  eaEmojiPalette,
  EmojiOption,
} from "../../lib/voting/eaEmojiPalette";
import { userHasEAEmojiReacts } from "../../lib/betas";
import { VotingProps } from "./votingProps";
import Menu from "@material-ui/core/Menu";
import classNames from "classnames";

const styles = (theme: ThemeType): JssStyles => ({
  overallAxis: {
    marginRight: 1,
  },
  button: {
    marginTop: -1,
    display: "flex",
    alignItems: "center",
    borderRadius: theme.borderRadius.small,
    color: theme.palette.grey[600],
    padding: "0 4px",
    gap: "4px",
    marginLeft: 2,
    height: 26,
    cursor: "pointer",
    userSelect: "none",
    border: "1px solid transparent",
    "&:hover": {
      background: theme.palette.grey[100],
    },
  },
  buttonSelected: {
    background: theme.palette.primaryAlpha(0.05),
    color: theme.palette.primary.main,
    border: `1px solid ${theme.palette.primaryAlpha(0.5)}`,
    "&:hover": {
      background: theme.palette.primaryAlpha(0.2),
    },
  },
  emojiPreview: {
    fontSize: "1.3em",
    color: theme.palette.primary.main,
  },
  tooltip: {
    background: theme.palette.panelBackground.tooltipBackground2,
    color: theme.palette.text.tooltipText,
    transform: "translateY(-8px)",
    textAlign: "center",
    maxWidth: 190,
  },
  addEmojiTooltip: {
    transform: "translateY(-10px)",
  },
  addEmojiIcon: {
    transform: "translateY(2px)",
  },
  tooltipSecondaryText: {
    color: theme.palette.text.tooltipTextDim,
  },
  tooltipEmojiRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
  },
  tooltipEmoji: {
    fontSize: "1.4em",
    color: theme.palette.primary.main,
  },
  menu: {
    "& .MuiPaper-root": {
      transform: "translateY(8px) !important",
      border: `1px solid ${theme.palette.grey[200]}`,
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
  const result = [];
  for (const emojiOption of eaAnonymousEmojiPalette) {
    result.push({
      emojiOption,
      score: extendedScore?.[emojiOption.name] ?? 0,
      anonymous: true,
    });
  }

  if (!extendedScore || !Object.keys(extendedScore).length) {
    return result;
  }

  for (const emojiOption of eaEmojiPalette) {
    if ((extendedScore[emojiOption.name] ?? 0) > 0) {
      result.push({
        emojiOption,
        score: extendedScore[emojiOption.name],
        anonymous: false,
      });
    }
  }
  return result;
}

const AnonymousEmojiTooltipContent: FC<{
  emojiOption: EmojiOption,
  count: number,
  classes: ClassesType,
}> = ({emojiOption, count, classes}) => {
  return (
    <div>
      <div>
        {count === 1 ? "1 person" : `${count} people`}{" "}
        <span className={classes.tooltipSecondaryText}>reacted with</span>
      </div>
      <div className={classes.tooltipEmojiRow}>
        <span className={classes.tooltipEmoji}>
          <emojiOption.Component />
        </span>{" "}
        {emojiOption.label}
      </div>
    </div>
  );
}

const joinStringList = (items: string[]) =>
  items.length > 1
    ? items.slice(0, -1).join(", ") + ", and " + items.at(-1)
    : items[0];

const EmojiTooltipContent: FC<{
  currentUser: UsersCurrent | null,
  emojiOption: EmojiOption,
  isSelected: boolean,
  reactors?: Record<string, string[]>,
  classes: ClassesType,
}> = ({currentUser, emojiOption, isSelected, reactors, classes}) => {
  let displayNames = reactors?.[emojiOption.name] ?? [];
  if (currentUser) {
    const {displayName} = currentUser;
    displayNames = displayNames.filter((name) => name !== displayName);
    if (isSelected) {
      displayNames = ["You", ...displayNames];
    }
  }
  return (
    <div>
      {displayNames.length > 0 &&
        <div>
          {joinStringList(displayNames)}{" "}
          <span className={classes.tooltipSecondaryText}>reacted with</span>
        </div>
      }
      <div className={classes.tooltipEmojiRow}>
        <span className={classes.tooltipEmoji}>
          <emojiOption.Component />
        </span>{" "}
        {emojiOption.label}
      </div>
    </div>
  );
}

const EmojiReactsSection: FC<{
  document: Pick<CommentVotingComponentProps, "document">["document"],
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
}> = ({document, voteProps, classes}) => {
  const currentUser = useCurrentUser();
  const post = usePostsPageContext();
  const {openDialog} = useDialog();
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
      voteType: "neutral",
      extendedVote: {
        ...voteProps.document.currentUserExtendedVote,
        [emojiOption.name]: !isEmojiSelected(voteProps, emojiOption),
      },
      currentUser,
    });
  }, [currentUser, openDialog, voteProps]);

  const reactions = getCurrentReactions(voteProps);

  const {EAEmojiPalette, ForumIcon, LWTooltip} = Components;
  return (
    <>
      {reactions.map(({emojiOption, anonymous, score}) => {
        const isSelected = isEmojiSelected(voteProps, emojiOption);
        return (
          <LWTooltip
            key={emojiOption.name}
            title={
              anonymous
                ? (
                  <AnonymousEmojiTooltipContent
                    emojiOption={emojiOption}
                    count={score}
                    classes={classes}
                  />
                )
                : (
                  <EmojiTooltipContent
                    currentUser={currentUser}
                    emojiOption={emojiOption}
                    isSelected={isSelected}
                    reactors={post?.commentEmojiReactors?.[document._id]}
                    classes={classes}
                  />
                )
            }
            placement="top"
            popperClassName={classes.tooltip}
          >
            <div
              role="button"
              onClick={() => onSelectEmoji(emojiOption)}
              className={classNames(classes.button, {
                [classes.buttonSelected]: isSelected,
              })}
            >
              <div className={classes.emojiPreview}>
                <emojiOption.Component />
              </div>
              <div>{score}</div>
            </div>
          </LWTooltip>
        );
      })}
      <div
        role="button"
        onClick={onOpenMenu}
        className={classes.button}
      >
        <LWTooltip
          title="Add reaction"
          placement="top"
          popperClassName={classNames(classes.tooltip, classes.addEmojiTooltip)}
        >
          <ForumIcon
            icon="AddEmoji"
            noDefaultStyles
            className={classes.addEmojiIcon}
          />
        </LWTooltip>
      </div>
      <Menu
        onClick={onCloseMenu}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        className={classes.menu}
      >
        {everOpened && <EAEmojiPalette onSelectEmoji={onSelectEmoji} />}
      </Menu>
    </>
  );
}

interface EAEmojisVoteOnCommentProps extends CommentVotingComponentProps {
  classes: ClassesType,
}

const EAEmojisVoteOnComment = ({
  document,
  hideKarma = false,
  collection,
  votingSystem,
  classes,
}: EAEmojisVoteOnCommentProps) => {
  const voteProps = useVote(
    document,
    collection.options.collectionName,
    votingSystem,
  );
  const {OverallVoteAxis, TwoAxisVoteOnComment} = Components;
  return (
    <>
      {userHasEAEmojiReacts(null)
        ? (
          <>
            <OverallVoteAxis
              document={document}
              hideKarma={hideKarma}
              voteProps={voteProps}
              className={classes.overallAxis}
              showBox
            />
            <EmojiReactsSection
              document={document}
              voteProps={voteProps}
              classes={classes}
            />
          </>
        )
        : (
          <TwoAxisVoteOnComment
            document={document}
            hideKarma={hideKarma}
            voteProps={voteProps}
            collection={collection}
            votingSystem={votingSystem}
          />
        )
      }
    </>
  );
}

const EAEmojisVoteOnCommentComponent = registerComponent(
  "EAEmojisVoteOnComment",
  EAEmojisVoteOnComment,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAEmojisVoteOnComment: typeof EAEmojisVoteOnCommentComponent
  }
}
