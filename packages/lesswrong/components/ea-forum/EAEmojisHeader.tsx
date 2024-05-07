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
    padding: 6,
    userSelect: "none",
    position: "absolute",
    zIndex: 3,
    marginLeft: -28,
    marginTop: -32,
    fontSize: 24,
  },
  emojiTooltip: {
    padding: 12,
    borderRadius: theme.borderRadius.default,
    backgroundColor: theme.palette.dropdown.background,
    border: `1px solid ${theme.palette.dropdown.border}`,
    "& .SectionTitle-root": {
      marginTop: 0,
      paddingBottom: 4,
    },
  },
  emojiTooltipContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  emojiCursor: {
    pointerEvents: "none",
    "& .ForumIcon-root": {
      color: `${theme.palette.emojiHeader.placeholder} !important`,
    },
  },
  pickerButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.loginInput,
    fontSize: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
  },
  input: {
    minHeight: 40,
    padding: 8,
  },
  textArea: {
    minHeight: 92,
    width: "100%",
    resize: "none",
  },
  button: {
    flexGrow: 1,
  },
  row: {
    display: "flex",
    gap: "12px",
    width: "100%",
  },
});

const isValidTarget = (e: EventTarget | null): e is HTMLDivElement =>
  !!e && "tagName" in e && (e.tagName === "DIV" || e.tagName === "HEADER");

type BannerEmoji = {
  userId: string,
  displayName?: string,
  emoji?: string,
  x: number,
  y: number,
  theta: number,
}

const Emoji: FC<{
  emoji: BannerEmoji,
  currentUser: UsersCurrent | null,
  removeEmoji?: () => Promise<void>,
  classes: ClassesType<typeof styles>,
}> = ({
  emoji: {userId, x, y, theta, emoji},
  currentUser,
  removeEmoji,
  classes,
}) => {
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const isCurrentUser = userId === currentUser?._id;
  const onClick = useCallback(() => {
    if (isCurrentUser) {
      void removeEmoji?.();
    }
  }, [isCurrentUser, removeEmoji]);
  const {
    LWTooltip, ForumIcon, SectionTitle, EAButton, EAOnboardingInput,
  } = Components;
  return (
    <figure
      className={classNames(classes.emoji, !emoji && classes.emojiCursor)}
      style={{
        left: `${x * window.innerWidth}px`,
        top: `${y * EMOJIS_HEADER_HEIGHT}px`,
        transform: `rotate(${theta}deg)`,
      }}
    >
      <LWTooltip
        title={
          <div className={classes.emojiTooltipContent}>
            <div className={classes.row}>
              <div>
                <SectionTitle title="Emoji" />
                <div className={classes.pickerButton}>{emoji || "👍"}</div>
              </div>
              <div>
                <SectionTitle title="Link to" />
                <EAOnboardingInput
                  value={link}
                  setValue={setLink}
                  placeholder="https://example.com"
                  className={classes.input}
                />
              </div>
            </div>
            <div>
              <SectionTitle title="The good news" />
              <EAOnboardingInput
                value={description}
                setValue={setDescription}
                placeholder="Show when you hover the emoji"
                As="textarea"
                rows={3}
                className={classNames(classes.input, classes.textArea)}
              />
            </div>
            <div className={classes.row}>
              <EAButton style="grey" className={classes.button}>
                Cancel
              </EAButton>
              <EAButton className={classes.button}>
                Add good news
              </EAButton>
            </div>
          </div>
        }
        placement="bottom-start"
        clickable
        popperClassName={classes.emojiTooltip}
      >
        {emoji || <ForumIcon icon="AddEmoji" onClick={onClick} />}
      </LWTooltip>
    </figure>
  );
}

type Point = {x: number, y: number};

const EmojiPlaceholder: FC<{
  hoverPos: Point,
  classes: ClassesType<typeof styles>,
}> = ({hoverPos: pos, classes}) => {
  // const [insertPos, setInsertPos] = useState<Point | null>(null);

  // if (insertPos) {
    // return (
      // <div>
        // K
      // </div>
    // );
  // }

  return (
    <Emoji
      emoji={{displayName: "", userId: "", theta: 0, emoji: "", ...pos}}
      currentUser={null}
      classes={classes}
    />
  );
}

export const EAEmojisHeader = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [hoverPos, setHoverPos] = useState<Point | null>(null);
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
  }, []);

  // const removeEmoji = useCallback(async () => {
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
  // }, []);

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
            <EmojiPlaceholder hoverPos={hoverPos} classes={classes} />
          }
          <Emoji
            emoji={{
              displayName: "",
              userId: "",
              theta: 0,
              x: 0.5,
              y: 0.5,
              emoji: "👍",
            }}
            currentUser={null}
            classes={classes}
          />
        </div>
      </AnalyticsContext>
    </ForumNoSSR>
  );
}

const EAEmojisHeaderComponent = registerComponent(
  "EAEmojisHeader",
  EAEmojisHeader,
  {styles, stylePriority: 2},
);

declare global {
  interface ComponentTypes {
    EAEmojisHeader: typeof EAEmojisHeaderComponent
  }
}
