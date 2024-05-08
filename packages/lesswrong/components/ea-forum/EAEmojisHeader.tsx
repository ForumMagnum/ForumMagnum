import React, { FC, MouseEvent, ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { isClient } from "../../lib/executionEnvironment";
import { EMOJIS_HEADER_HEIGHT } from "../common/Header";
import { useCurrentUser } from "../common/withUser";
import { gql, useMutation, useQuery } from "@apollo/client";
import ForumNoSSR from "../common/ForumNoSSR";
import classNames from "classnames";

if (isClient) {
  require("emoji-picker-element");
}

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

// const MAX_THETA = 25;

const emojisQuery = gql`
  query BannerEmojis {
    BannerEmojis {
      userId
      displayName
      emoji
      x
      y
      theta
    }
  }
`;

const addEmojiMutation = gql`
  mutation AddBannerEmoji(
    $emoji: String!,
    $x: Float!,
    $y: Float!,
    $theta: Float!
  ) {
    AddBannerEmoji(
      emoji: $emoji,
      x: $x,
      y: $y,
      theta: $theta
    ) {
      userId
      displayName
      emoji
      x
      y
      theta
    }
  }
`;

const removeEmojiMutation = gql`
  mutation RemoveBannerEmoji {
    RemoveBannerEmoji {
      userId
      displayName
      emoji
      x
      y
      theta
    }
  }
`;

export type BannerEmoji = {
  userId: string,
  displayName?: string,
  emoji?: string,
  x: number,
  y: number,
  theta: number,
}

const emojiContext = createContext<{
  currentUser: UsersCurrent | null,
  removeEmoji: () => Promise<void>,
  insertEmoji: string,
  setInsertEmoji: (value: string) => void,
  onCancelInsert: () => void,
  classes: ClassesType<typeof styles>,
} | null>(null);

const useEmojiContext = () => {
  const value = useContext(emojiContext);
  if (!value) {
    throw new Error("No emoji context provider");
  }
  return value;
}

const EmojiPicker = ({onChange}: {onChange?: (value: string) => void}) => {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const picker = ref.current;
    if (picker && onChange) {
      const handler = (ev: AnyBecauseTodo) => {
        const emoji = ev?.detail?.unicode;
        if (emoji && typeof emoji === "string") {
          onChange(emoji);
        }
      }
      picker.addEventListener("emoji-click", handler);
      return () => picker?.removeEventListener("emoji-click", handler);
    }
  }, [ref, onChange]);
  return (
    // @ts-ignore
    <emoji-picker ref={ref} />
  );
}

const Emoji: FC<{
  emoji: BannerEmoji,
  children?: ReactNode,
}> = ({
  emoji: {userId, x, y, theta, emoji},
  children,
}) => {
  const {currentUser, removeEmoji, classes} = useEmojiContext();
  const isCurrentUser = userId === currentUser?._id;

  const onClick = useCallback(() => {
    if (isCurrentUser) {
      void removeEmoji?.();
    }
  }, [isCurrentUser, removeEmoji]);

  const {ForumIcon} = Components;
  return (
    <figure
      className={classNames(classes.emoji, !emoji && classes.emojiCursor)}
      style={{
        left: `${x * window.innerWidth}px`,
        top: `${y * EMOJIS_HEADER_HEIGHT}px`,
        transform: `rotate(${theta}deg)`,
      }}
    >
      {emoji || <ForumIcon icon="AddEmoji" onClick={onClick} />}
      {children}
    </figure>
  );
}

type Point = {x: number, y: number};

const EmojiPlaceholder: FC<{hoverPos: Point}> = ({hoverPos}) => {
  return (
    <Emoji emoji={{
      displayName: "",
      userId: "",
      theta: 0,
      emoji: "",
      ...hoverPos
    }} />
  );
}

const AddEmoji: FC<{insertPos: Point}> = ({insertPos}) => {
  const {insertEmoji, setInsertEmoji, onCancelInsert, classes} = useEmojiContext();
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  const {LWPopper, LWTooltip, SectionTitle, EAButton, EAOnboardingInput} = Components;
  return (
    <>
      <LWPopper
        open
        clickable
        placement="bottom-start"
        anchorEl={anchorElement}
        key={`${insertPos.x},${insertPos.y}`}
      >
        <div className={classes.emojiTooltip}>
          <div className={classes.row}>
            <div>
              <SectionTitle title="Emoji" />
              <LWTooltip
                title={<EmojiPicker onChange={setInsertEmoji} />}
                tooltip={false}
                clickable
              >
                <div className={classes.pickerButton}>{insertEmoji}</div>
              </LWTooltip>
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
            <EAButton
              onClick={onCancelInsert}
              style="grey"
              className={classes.button}
            >
              Cancel
            </EAButton>
            <EAButton className={classes.button}>
              Add good news
            </EAButton>
          </div>
        </div>
      </LWPopper>
      <Emoji emoji={{
        displayName: "",
        userId: "",
        theta: 0,
        emoji: insertEmoji,
        ...insertPos
      }} >
        <div ref={setAnchorElement} />
      </Emoji>
    </>
  );
}

export const EAEmojisHeader = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [insertEmoji, setInsertEmoji] = useState("👍");
  const [hoverPos, setHoverPos] = useState<Point | null>(null);
  const [insertPos, setInsertPos] = useState<Point | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const {data, refetch} = useQuery(emojisQuery);
  const [emojis, setEmojis] = useState<BannerEmoji[]>(data?.BannerEmojis ?? []);

  useEffect(() => {
    setEmojis(data?.BannerEmojis ?? []);
  }, [data?.BannerEmojis]);

  const [rawAddEmoji, {loading: isAddingEmoji}] = useMutation(
    addEmojiMutation,
    {errorPolicy: "all"},
  );

  // const [rawRemoveEmoji, {loading: isRemovingEmoji}] = useMutation(
  const [rawRemoveEmoji] = useMutation(
    removeEmojiMutation,
    {errorPolicy: "all"},
  );

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

  const addEmoji = useCallback(async (
    emoji: string,
    x: number,
    y: number,
    theta: number,
  ) => {
    const result = await rawAddEmoji({variables: {emoji, x, y, theta}});
    void refetch();
    return result;
  }, [rawAddEmoji, refetch]);

  const removeEmoji = useCallback(async () => {
    const result = await rawRemoveEmoji();
    const newEmojis = result.data?.RemoveBannerEmoji;
    if (Array.isArray(newEmojis)) {
      setEmojis(newEmojis);
    }
    await refetch();
  }, [rawRemoveEmoji, refetch]);

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

  const onClick = useCallback(async ({target, clientX, clientY}: MouseEvent) => {
    if (isValidTarget(target)) {
      // const coords = normalizeCoords(clientX, clientY);
      // if (coords) {
        // const theta = Math.round((Math.random() * MAX_THETA * 2) - MAX_THETA);
        // const result = await addEmoji(emoji, coords.x, coords.y, theta);
        // const newHearts = result.data?.AddGivingSeasonHeart;
        // if (Array.isArray(newHearts)) {
          // setEmojis(newHearts);
        // }
        // setHoverPos(null);
      // }
      const coords = normalizeCoords(clientX, clientY);
      if (coords) {
        setInsertPos(coords);
        setHoverPos(null);
      }
    }
  }, [normalizeCoords]);

  const onCancelInsert = useCallback(() => setInsertPos(null), []);

  const canAddEmoji = !!currentUser && !isAddingEmoji;

  return (
    <ForumNoSSR>
      <AnalyticsContext pageSectionContext="ea-emoji-banner">
        <emojiContext.Provider value={{
          currentUser,
          removeEmoji,
          insertEmoji,
          setInsertEmoji,
          onCancelInsert,
          classes,
        }}>
          <div
            {...(canAddEmoji ? {onMouseMove, onMouseOut, onClick} : {})}
            className={classes.root}
            ref={ref}
          >
            {emojis.map((emoji) => <Emoji key={emoji.userId} emoji={emoji} />)}
            {hoverPos && <EmojiPlaceholder hoverPos={hoverPos} />}
            {insertPos && <AddEmoji insertPos={insertPos} />}
          </div>
        </emojiContext.Provider>
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
