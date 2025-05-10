import React, { useState } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import classNames from "classnames";
import { ForumIconName, ForumIcon } from "../common/ForumIcon";
import { useTracking } from "@/lib/analyticsEvents";
import { useHover } from "../common/withHover";
import { InteractionWrapper } from "../common/useClickableCell";
import { ForumEventResultPopper } from "./ForumEventResultPopper";
import { LWTooltip } from "../common/LWTooltip";
import { UsersNameDisplay } from "../users/UsersNameDisplay";

const styles = (theme: ThemeType) => ({
  sticker: {
    color: theme.palette.forumEvent.draftSticker,
    position: "absolute",
    transformOrigin: "center",
    padding: 4,
    userSelect: "none",
    fontSize: 20,
    [theme.breakpoints.down("xs")]: {
      fontSize: 16,
    },
  },
  hoverSticker: {
    opacity: 0.5,
    cursor: "none",
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  clearSticker: {
    top: -1,
    right: -4,
    position: "absolute",
    backgroundColor: `color-mix(in oklab, ${theme.palette.text.alwaysBlack} 65%, ${theme.palette.text.alwaysWhite} 35%)`,
    padding: 2,
    borderRadius: "50%",
    cursor: "pointer",
    width: 11,
    height: 11,
    fontSize: 9,
    userSelect: "none",
    "&:hover": {
      backgroundColor: theme.palette.text.alwaysBlack,
    },
    [theme.breakpoints.down("xs")]: {
      top: -2,
      right: -4,
    },
  },
  cross: {
    color: theme.palette.text.alwaysWhite,
    opacity: 0.8,
    position: "absolute",
    fontSize: 12,
    top: -3,
    left: "1.7px",
  },
  commentPopper: {
    // Negative margin so the mouse doesn't leave the hover area when moving from the icon to the comment
    margin: "-2px 8px",
  },
});

const ForumEventStickerInner = ({ x, y, theta, user, comment, emoji, icon = "AddEmoji", tooltipDisabled, onClear, saveDraftSticker, setUserVoteRef, classes }: {
  x: number;
  y: number;
  theta: number;
  user?: UsersMinimumInfo;
  comment?: ShortformComments | null;
  emoji?: React.ReactNode
  icon?: ForumIconName;
  tooltipDisabled?: boolean;
  onClear?: () => void;
  saveDraftSticker?: (event: React.MouseEvent) => void;
  setUserVoteRef?: any
  classes: ClassesType<typeof styles>
}) => {
  const isHoverSticker = !!saveDraftSticker;

  const { captureEvent } = useTracking();

  const { eventHandlers, hover, anchorEl } = useHover();

  const [isPinned, setIsPinned] = useState(false);
  const [newRepliesCount, setNewRepliesCount] = useState(0);

  const popperOpen = hover || isPinned;

  return (
    <InteractionWrapper>
      <div
        className={classNames(classes.sticker, {[classes.hoverSticker]: isHoverSticker})}
        ref={setUserVoteRef}
        style={{
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          transform: `rotate(${theta}deg) translate(-50%, -50%)`,
        }}
        {...eventHandlers}
        onClick={saveDraftSticker}
      >
        <LWTooltip title={<UsersNameDisplay user={user} />} disabled={!(user && !comment)} placement="bottom">
          {/* onPointerDown rather than onClick because the button is very small */}
          {!isHoverSticker && onClear && (
            <div className={classes.clearSticker} onPointerDown={onClear}>
              <div className={classes.cross}>&times;</div>
            </div>
          )}
          {emoji ?? <ForumIcon icon={icon} />}
        </LWTooltip>
        {!isHoverSticker && !tooltipDisabled && user && comment && popperOpen && (
          <ForumEventResultPopper
            anchorEl={anchorEl}
            user={user}
            comment={comment}
            captureEvent={captureEvent}
            setIsPinned={setIsPinned}
            isPinned={isPinned}
            newRepliesCount={newRepliesCount}
            setNewRepliesCount={setNewRepliesCount}
            placement={y < 0.85 ? "bottom" : "top"}
            className={classes.commentPopper}
          />
        )}
      </div>
    </InteractionWrapper>
  );
}


export const ForumEventSticker = registerComponent( 'ForumEventSticker', ForumEventStickerInner, {styles});


