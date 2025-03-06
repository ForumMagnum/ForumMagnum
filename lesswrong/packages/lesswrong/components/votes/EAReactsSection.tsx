import React, { FC, MouseEvent, useState, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import type {
  CommentVotingComponentProps,
  PostVotingComponentProps,
} from "../../lib/voting/votingSystems";
import { useTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from "../common/withUser";
import { useDialog } from "../common/withDialog";
import {
  eaAnonymousEmojiPalette,
  eaEmojiPalette,
  EmojiOption,
  getEmojiMutuallyExclusivePartner,
} from "../../lib/voting/eaEmojiPalette";
import type { VotingProps } from "./votingProps";
import Menu from "@material-ui/core/Menu";
import classNames from "classnames";
import {alwaysShowAnonymousReactsSetting} from '../../lib/publicSettings'
import EAEmojiPalette from "@/components/votes/EAEmojiPalette";
import ForumIcon from "@/components/common/ForumIcon";
import LWTooltip from "@/components/common/LWTooltip";

const styles = (theme: ThemeType) => ({
  button: {
    display: "flex",
    alignItems: "center",
    borderRadius: theme.borderRadius.small,
    color: theme.palette.grey[600],
    padding: "0 4px",
    gap: "4px",
    marginLeft: 2,
    height: 24,
    cursor: "pointer",
    userSelect: "none",
    border: "1px solid transparent",
    "&:hover": {
      background: theme.palette.grey[100],
    },
  },
  buttonLarge: {
    gap: "6px",
  },
  buttonSelected: {
    background: theme.palette.primaryAlpha(0.05),
    color: theme.palette.primary.main,
    border: `1px solid ${theme.palette.primaryAlpha(0.5)}`,
    "&:hover": {
      background: theme.palette.primaryAlpha(0.2),
    },
  },
  buttonViewOnly: {
    cursor: 'default',
    "&:hover": {
      background: 'none'
    },
  },
  emojiPreview: {
    display: "flex",
    color: theme.palette.primary.main,
  },
  tooltip: {
    background: theme.palette.panelBackground.tooltipBackground2,
    color: theme.palette.text.tooltipText,
    transform: "translateY(-8px)",
    textAlign: "center",
    maxWidth: 190,
  },
  tooltipWide: {
    maxWidth: 400,
  },
  addEmojiTooltip: {
    transform: "translateY(-10px)",
  },
  addEmojiIcon: {
    transform: "translateY(2px)",
    width: "18px !important",
    height: "18px !important",
  },
  addEmojiIconLarge: {
    width: "20px !important",
    height: "20px !important",
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

const isEmojiSelected = (
  currentUserExtendedVote: AnyBecauseHard,
  emojiOption: EmojiOption,
) => Boolean(currentUserExtendedVote?.[emojiOption.name]);

const getCurrentReactions = (
  extendedScore?: AnyBecauseHard,
) => {
  const result = [];
  for (const emojiOption of eaAnonymousEmojiPalette) {
    if(alwaysShowAnonymousReactsSetting.get() || extendedScore?.[emojiOption.name]) result.push({
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
  classes: ClassesType<typeof styles>,
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
    ? items.slice(0, -1).join(", ") + ", and " + items[items.length - 1]
    : items[0];

const EmojiTooltipContent: FC<{
  currentUser: UsersCurrent | null,
  emojiOption: EmojiOption,
  isSelected: boolean,
  reactors?: Record<string, string[]>,
  classes: ClassesType<typeof styles>,
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

export type EAReactableDocument = CommentsList | PostsWithVotes;

export const isEAReactableDocument = (
  collectionName: VoteableCollectionName,
  _document: CommentVotingComponentProps["document"] | PostVotingComponentProps["document"],
): _document is EAReactableDocument => {
  return collectionName === "Posts" || collectionName === "Comments";
}

type EAReactsSectionOptions = {
  // viewOnly disables all interactivity, including tooltips
  viewOnly: true,
  document: {
    _id: string,
  },
  voteProps: {
    document?: {
      extendedScore: AnyBecauseHard,
      currentUserExtendedVote?: AnyBecauseHard,
    },
  },
} | {
  viewOnly?: false|null,
  document: EAReactableDocument,
  voteProps: VotingProps<VoteableTypeClient>,
};

const EAReactsSection: FC<{
  large?: boolean,
  classes: ClassesType<typeof styles>,
} & EAReactsSectionOptions> = ({document, voteProps, large, viewOnly, classes}) => {
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [everOpened, setEverOpened] = useState(false);
  const {captureEvent} = useTracking({
    eventType: "emojiMenuClicked",
    eventProps: {
      documentId: document._id,
      ...('collectionName' in voteProps && {itemType: voteProps.collectionName})
    },
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

  const onSelectEmoji = useCallback(async (emojiOption: EmojiOption) => {
    if (viewOnly) return;
    
    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {},
      });
      return;
    }

    const extendedVote = {
      ...voteProps.document.currentUserExtendedVote,
      [emojiOption.name]: !isEmojiSelected(voteProps.document?.currentUserExtendedVote, emojiOption),
    };
    const partner = getEmojiMutuallyExclusivePartner(emojiOption.name);
    if (partner && extendedVote[emojiOption.name]) {
      extendedVote[partner] = false;
    }

    await voteProps.vote({
      document: voteProps.document,
      voteType: voteProps.document.currentUserVote ?? "neutral",
      extendedVote,
      currentUser,
    });
  }, [currentUser, openDialog, voteProps, viewOnly]);

  const reactions = getCurrentReactions(voteProps.document?.extendedScore);
  return (
    <>
      {reactions.map(({emojiOption, anonymous, score}) => {
        const isSelected = isEmojiSelected(voteProps.document?.currentUserExtendedVote, emojiOption);
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
                    reactors={'emojiReactors' in document ? document.emojiReactors : undefined}
                    classes={classes}
                  />
                )
            }
            placement="top"
            popperClassName={classNames(classes.tooltip, {
              [classes.tooltipWide]: score > 10,
            })}
            disabled={!!viewOnly}
          >
            <div
              role="button"
              onClick={() => onSelectEmoji(emojiOption)}
              className={classNames(classes.button, {
                [classes.buttonSelected]: isSelected,
                [classes.buttonLarge]: large,
                [classes.buttonViewOnly]: viewOnly
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
      {!viewOnly && <div
        role="button"
        onClick={onOpenMenu}
        className={classNames(classes.button, {[classes.buttonLarge]: large})}
      >
        <LWTooltip
          title="Add reaction"
          placement="top"
          popperClassName={classNames(classes.tooltip, classes.addEmojiTooltip)}
        >
          <ForumIcon
            icon="AddEmoji"
            noDefaultStyles
            className={classNames(classes.addEmojiIcon, {
              [classes.addEmojiIconLarge]: large,
            })}
          />
        </LWTooltip>
      </div>}
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

const EAReactsSectionComponent = registerComponent(
  "EAReactsSection",
  EAReactsSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAReactsSection: typeof EAReactsSectionComponent
  }
}

export default EAReactsSectionComponent;
