import React, { useState } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import classNames from "classnames";
import { ForumIconName } from "../common/ForumIcon";
import { useTracking } from "@/lib/analyticsEvents";
import { useHover } from "../common/withHover";
import { InteractionWrapper } from "../common/useClickableCell";

const styles = (theme: ThemeType) => ({
  sticker: {
    // TODO This whole component is about to be refactored, this is just a placeholder colour in the meantime to keep the tests happy
    color: theme.palette.error.main,
    position: "absolute",
    transformOrigin: "center",
    "& svg": {
      fontSize: 20,
      [theme.breakpoints.down('xs')]: {
        fontSize: 16
      },
    }
  },
  hoverSticker: {
    opacity: 0.5,
    cursor: "none",
    [theme.breakpoints.down('xs')]: {
      display: "none"
    },
  },
  clearSticker: {
    top: -1,
    right: -3,
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
    [theme.breakpoints.down('xs')]: {
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
    left: "1.7px"
  },
  commentPopper: {
    margin: "0 8px",
  },
});

type ForumEventStickerProps = {
  x: number;
  y: number;
  theta: number;
  user?: UsersMinimumInfo;
  comment?: ShortformComments | null;
  icon?: ForumIconName;
  tooltipDisabled?: boolean;
  onClear?: () => void;
  saveStickerPos?: (event: React.MouseEvent) => void;
};
const ForumEventSticker = React.forwardRef<
  HTMLDivElement,
  ForumEventStickerProps & { classes: ClassesType<typeof styles> }
>(({ x, y, theta, user, comment, icon = "Heart", tooltipDisabled, onClear, saveStickerPos, classes }, ref) => {
  const { ForumIcon, ForumEventResultPopper, LWTooltip, UsersNameDisplay } = Components;

  const isHoverSticker = !!saveStickerPos;

  const { captureEvent } = useTracking();

  const { eventHandlers, hover, anchorEl } = useHover();

  const [isPinned, setIsPinned] = useState(false);
  const [newRepliesCount, setNewRepliesCount] = useState(0);

  const popperOpen = hover || isPinned;

  return (
    <InteractionWrapper>
      <div
        className={classNames(classes.sticker, {[classes.hoverSticker]: isHoverSticker})}
        ref={ref}
        style={{
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          transform: `rotate(${theta}deg) translate(-50%, -50%)`,
        }}
        {...eventHandlers}
        onClick={saveStickerPos}
      >
        <LWTooltip title={<UsersNameDisplay user={user} />} disabled={!!(user && comment) || isHoverSticker} placement="bottom">
          {/* onPointerDown rather than onClick because the button is very small */}
          {!isHoverSticker && onClear && (
            <div className={classes.clearSticker} onPointerDown={onClear}>
              <div className={classes.cross}>&times;</div>
            </div>
          )}
          <ForumIcon icon={icon} />
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
            placement="bottom"
            className={classes.commentPopper}
          />
        )}
      </div>
    </InteractionWrapper>
  );
});


const ForumEventStickerComponent = registerComponent( 'ForumEventSticker', ForumEventSticker, {styles});

declare global {
  interface ComponentTypes {
    ForumEventSticker: typeof ForumEventStickerComponent;
  }
}
