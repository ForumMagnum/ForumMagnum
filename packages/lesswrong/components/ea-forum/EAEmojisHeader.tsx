import React, { FC, MouseEvent, useCallback, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { EMOJIS_HEADER_HEIGHT } from "../common/Header";
import ForumNoSSR from "../common/ForumNoSSR";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    zIndex: 1,
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  emoji: {
    position: "absolute",
    zIndex: 3,
    marginLeft: -20,
    marginTop: -20,
  },
  emojiTooltip: {
    backgroundColor: `${theme.palette.panelBackground.tooltipBackground2} !important`,
  },
  emojiCursor: {
    pointerEvents: "none",
    "& .ForumIcon-root": {
      color: `${theme.palette.emojiHeader.placeholder} !important`,
    },
  },
});

const isValidTarget = (e: EventTarget | null): e is HTMLDivElement =>
  !!e && "tagName" in e && (e.tagName === "DIV" || e.tagName === "HEADER");

type BannerEmoji = {
  userId: string,
  displayName: string,
  x: number,
  y: number,
  theta: number,
}

const Emoji: FC<{
  emoji: BannerEmoji,
  currentUser: UsersCurrent | null,
  removeEmoji: () => Promise<void>,
  classes: ClassesType<typeof styles>,
}> = ({
  emoji: {userId, displayName, x, y, theta},
  currentUser,
  removeEmoji: removeEmoji,
  classes,
}) => {
  const isCurrentUser = userId === currentUser?._id;
  const title = isCurrentUser
    ? "You added an amoji (click to remove)"
    : `${displayName} added a emoji`;
  const onClick = useCallback(() => {
    if (isCurrentUser) {
      void removeEmoji();
    }
  }, [isCurrentUser, removeEmoji]);
  const {LWTooltip, ForumIcon} = Components;
  return (
    <div
      className={classNames(classes.emoji, !displayName && classes.emojiCursor)}
      style={{
        left: `${x * window.innerWidth}px`,
        top: `${y * EMOJIS_HEADER_HEIGHT}px`,
        transform: `rotate(${theta}deg)`,
      }}
    >
      <LWTooltip
        title={title}
        placement="bottom"
        popperClassName={classes.emojiTooltip}
      >
        <ForumIcon icon="AddEmoji" onClick={onClick} />
      </LWTooltip>
    </div>
  );
}

export const EAEmojisHeader = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [hoverPos, setHoverPos] = useState<{x: number, y: number} | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const normalizeCoords = useCallback((clientX: number, clientY: number) => {
    if (ref.current) {
      clientX += window.scrollX;
      clientY += window.scrollY;
      const bounds = ref.current.getBoundingClientRect();
      if (
        clientX > bounds.left &&
        clientX < bounds.right &&
        clientY > bounds.top &&
        clientY < bounds.bottom
      ) {
        return {
          x: clientX / bounds.width,
          y: clientY / bounds.height,
        };
      }
    }
    return null;
  }, [ref]);

  const onMouseMove = useCallback(({target, clientX, clientY}: MouseEvent) => {
    if (isValidTarget(target)) {
      setHoverPos(normalizeCoords(clientX, clientY));
    } else {
      setHoverPos(null);
    }
  }, [normalizeCoords]);

  const onMouseOut = useCallback(() => {
    setHoverPos(null);
  }, []);

  const onClick = useCallback(() => {
    console.log("click");
  }, []);

  const removeEmoji = useCallback(async () => {
    // const result = await rawRemoveHeart({
      // variables: {
        // electionName: eaGivingSeason23ElectionName,
      // },
    // });
    // const newHearts = result.data?.RemoveGivingSeasonHeart;
    // if (Array.isArray(newHearts)) {
      // setHearts(newHearts);
    // }
    // await refetch();
  // }, [rawRemoveHeart, refetch]);
  }, []);

  return (
    <ForumNoSSR>
      <AnalyticsContext pageSectionContext="ea-emoji-banner">
        <div
          onClick={onClick}
          onMouseMove={onMouseMove}
          onMouseOut={onMouseOut}
          className={classes.root}
          ref={ref}
        >
          {hoverPos &&
            <Emoji
              emoji={{displayName: "", userId: "", theta: 0, ...hoverPos}}
              currentUser={null}
              removeEmoji={removeEmoji}
              classes={classes}
            />
          }
        </div>
      </AnalyticsContext>
    </ForumNoSSR>
  );
}

const EAEmojisHeaderComponent = registerComponent(
  "EAEmojisHeader",
  EAEmojisHeader,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAEmojisHeader: typeof EAEmojisHeaderComponent
  }
}
