import React, { FC, MouseEvent, ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Components, registerComponent, validateUrl } from "../../lib/vulcan-lib";
import { useLoginPopoverContext } from "../hooks/useLoginPopoverContext";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { isClient } from "../../lib/executionEnvironment";
import { userIsAdminOrMod } from "../../lib/vulcan-users";
import { EMOJIS_HEADER_HEIGHT } from "../common/Header";
import { useCurrentUser } from "../common/withUser";
import { Link } from "../../lib/reactRouterWrapper";
import { gql, useMutation, useQuery } from "@apollo/client";
import ForumNoSSR from "../common/ForumNoSSR";
import classNames from "classnames";
import { siteUrlSetting } from "../../lib/instanceSettings";
import { useMessages } from "../common/withMessages";

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
  emojiTooltip: {
    width: 320,
    maxWidth: "100vw",
    padding: 12,
    borderRadius: theme.borderRadius.default,
    backgroundColor: theme.palette.dropdown.background,
    border: `1px solid ${theme.palette.dropdown.border}`,
    boxShadow: theme.palette.emojiHeader.tooltipShadow,
    "& .SectionTitle-root": {
      marginTop: -1,
      paddingBottom: 4,
    },
    "& .SectionTitle-title": {
      fontSize: 12,
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
  linkToSection: {
    flexGrow: 1,
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
  emoji: {
    padding: 6,
    userSelect: "none",
    position: "absolute",
    zIndex: 3,
    marginLeft: -28,
    marginTop: -32,
    fontSize: 24,
    "&:hover $removeButton": {
      display: "block",
    },
  },
  goodNews: {
    padding: 12,
    borderRadius: theme.borderRadius.default,
    backgroundColor: theme.palette.dropdown.background,
    border: `1px solid ${theme.palette.dropdown.border}`,
    boxShadow: theme.palette.emojiHeader.tooltipShadow,
    color: theme.palette.grey[1000],
  },
  emojiLink: {
    display: "block",
    "&:hover": {
      opacity: 1,
      transform: "scale(1.1)",
      textShadow: theme.palette.emojiHeader.emojiShadow,
    },
  },
  removeButton: {
    display: "none",
    color: `${theme.palette.text.alwaysWhite} !important`,
    background: theme.palette.emojiHeader.removeButton,
    padding: 2,
    borderRadius: "50%",
    fontSize: 18,
    cursor: "pointer",
    position: "absolute",
    top: 0,
    right: -10,
    "&:hover": {
      transform: "scale(1.2)",
    },
  },
});

export const MAX_THETA = 25;

const isValidTarget = (
  e: EventTarget | null,
  clientX: number,
  clientY: number,
): e is HTMLDivElement => {
  if (!e) {
    return false;
  }
  if (!("tagName" in e)) {
    return false;
  }
  if (e.tagName !== "DIV" && e.tagName !== "HEADER") {
    return false;
  }

  clientX += window.scrollX;
  clientY += window.scrollY;

  const startPadding = 25;
  if (clientX < startPadding || clientY < startPadding) {
    return false;
  }

  const endPadding = 6;
  if (
    clientX + endPadding >= window.innerWidth ||
    clientY + endPadding >= EMOJIS_HEADER_HEIGHT
  ) {
    return false;
  }

  return !!(e as HTMLElement).closest?.(".EAEmojisHeader-root");
}

const emojisQuery = gql`
  query BannerEmojis {
    BannerEmojis {
      id
      userId
      displayName
      emoji
      link
      description
      x
      y
      theta
    }
  }
`;

const addEmojiMutation = gql`
  mutation AddBannerEmoji(
    $emoji: String!,
    $link: String!,
    $description: String!,
    $x: Float!,
    $y: Float!,
    $theta: Float!
  ) {
    AddBannerEmoji(
      emoji: $emoji,
      link: $link,
      description: $description,
      x: $x,
      y: $y,
      theta: $theta
    ) {
      id
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
  mutation RemoveBannerEmoji($id: String!) {
    RemoveBannerEmoji(id: $id) {
      id
      userId
      displayName
      emoji
      link
      description
      x
      y
      theta
    }
  }
`;

export type BannerEmoji = {
  id: string,
  userId: string,
  displayName: string,
  emoji: string,
  x: number,
  y: number,
  theta: number,
  link: string,
  description: string,
}

const emojiContext = createContext<{
  currentUser: UsersCurrent | null,
  setEmojis: (emojis: BannerEmoji[]) => void,
  addEmoji: (
    emoji: string,
    link: string,
    description: string,
    x: number,
    y: number,
    theta: number,
  ) => Promise<{data?: {AddBannerEmoji: BannerEmoji[]}}>,
  removeEmoji: (id: string) => Promise<void>,
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

const pickerStyles = `
  input.search {
    font-family: "Inter";
    border-radius: 4px;
    padding: 3px 5px;
    border-color: #ddd;
  }
  @media (prefers-color-scheme: dark) {
    input.search {
      border-color: #444;
    }
  }
`;

const EmojiPicker = ({onChange}: {onChange?: (value: string) => void}) => {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const picker = ref.current;
    if (picker) {
      const styleId = "fm-emoji-style";
      const styleElem = picker.shadowRoot?.getElementById(styleId);
      if (!styleElem) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = pickerStyles;
        picker.shadowRoot?.appendChild(style);
      }

      const onChangeHandler = (ev: AnyBecauseTodo) => {
        const emoji = ev?.detail?.unicode;
        if (emoji && typeof emoji === "string") {
          onChange?.(emoji);
        }
      }
      picker.addEventListener("emoji-click", onChangeHandler);
      return () => picker?.removeEventListener("emoji-click", onChangeHandler);
    }
  }, [ref, onChange]);
  return (
    // @ts-ignore
    <emoji-picker ref={ref} />
  );
}

/**
 * The `Link` component in `react-router-dom` insists on prepending the site
 * URL to onsite links, even if they already include it. Remove it explicitely
 * here to avoid this.
 */
const onsiteLinkRegex = new RegExp(`^(http(s)?://)?${siteUrlSetting.get()}(.*)`);
const formatOnsiteLink = (link: string) =>
  link.match(onsiteLinkRegex)?.[3] ?? link;

const Emoji: FC<{
  emoji: BannerEmoji,
  children?: ReactNode,
}> = ({
  emoji: {id, userId, displayName, link, description, x, y, theta, emoji},
  children,
}) => {
  const {currentUser, removeEmoji, classes} = useEmojiContext();
  const isCurrentUser = userId === currentUser?._id;
  const canModerate = isCurrentUser || userIsAdminOrMod(currentUser);
  const isPlaceholder = !displayName;
  const canRemove = canModerate && !isPlaceholder;

  const onRemove = useCallback(() => {
    if (canRemove) {
      void removeEmoji?.(id);
    }
  }, [canRemove, id, removeEmoji]);

  const {LWTooltip, ForumIcon} = Components;
  return (
    <figure
      className={classNames(classes.emoji, !emoji && classes.emojiCursor)}
      style={{left: `${x * 100}%`, top: `${y * 100}%`}}
    >
      <LWTooltip
        title={description}
        placement="bottom"
        popperClassName={classes.goodNews}
      >
        <div style={{transform: `rotate(${theta}deg)`}}>
          {emoji
            ? (
              link
                ? (
                  <Link
                    to={formatOnsiteLink(link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classes.emojiLink}
                  >
                    {emoji}
                  </Link>
                )
                : emoji
            )
            : <ForumIcon icon="AddEmoji" />
          }
        </div>
      </LWTooltip>
      {canRemove &&
        <ForumIcon
          icon="Close"
          onClick={onRemove}
          className={classes.removeButton}
        />
      }
      {children}
    </figure>
  );
}

type Point = {x: number, y: number};

const EmojiPlaceholder: FC<{hoverPos: Point}> = ({hoverPos}) => {
  return (
    <Emoji emoji={{
      id: "",
      displayName: "",
      userId: "",
      theta: 0,
      emoji: "",
      link: "",
      description: "",
      ...hoverPos
    }} />
  );
}

const AddEmoji: FC<{insertPos: Point}> = ({insertPos}) => {
  const {
    setEmojis,
    addEmoji,
    insertEmoji,
    setInsertEmoji,
    onCancelInsert,
    classes,
  } = useEmojiContext();
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  const onInsert = useCallback(async () => {
    const {x, y} = insertPos;
    const theta = Math.round((Math.random() * MAX_THETA * 2) - MAX_THETA);
    const result = await addEmoji(insertEmoji, link, description, x, y, theta);
    const newEmojis = result.data?.AddBannerEmoji;
    if (Array.isArray(newEmojis)) {
      setEmojis(newEmojis);
    }
    onCancelInsert();
  }, [insertPos, link, description, addEmoji, insertEmoji, setEmojis, onCancelInsert]);

  const onClickAway = useCallback(() => {
    if (!link && !description) {
      onCancelInsert();
    }
  }, [onCancelInsert, link, description]);

  const canAdd = !!(insertEmoji && link && description);

  const {
    LWPopper, LWTooltip, SectionTitle, EAButton, EAOnboardingInput,
    LWClickAwayListener,
  } = Components;
  return (
    <>
      <LWPopper
        open
        clickable
        placement="bottom-start"
        anchorEl={anchorElement}
        key={`${insertPos.x},${insertPos.y}`}
      >
        <LWClickAwayListener onClickAway={onClickAway}>
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
              <div className={classes.linkToSection}>
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
                placeholder="Shows when you hover the emoji"
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
              <EAButton
                onClick={onInsert}
                disabled={!canAdd}
                className={classes.button}
              >
                Add good news
              </EAButton>
            </div>
          </div>
        </LWClickAwayListener>
      </LWPopper>
      <Emoji emoji={{
        id: "",
        displayName: "",
        userId: "",
        theta: 0,
        emoji: insertEmoji,
        link: "",
        description: "",
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
  const {onLogin} = useLoginPopoverContext();
  const [insertEmoji, setInsertEmoji] = useState("👍");
  const [hoverPos, setHoverPos] = useState<Point | null>(null);
  const [insertPos, setInsertPos] = useState<Point | null>(null);
  const {flash} = useMessages();
  const {captureEvent} = useTracking();
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
    link: string,
    description: string,
    x: number,
    y: number,
    theta: number,
  ) => {
    link = validateUrl(link);
    captureEvent("emojiBannerAdd", {emoji, link, description, x, y, theta});
    const result = await rawAddEmoji({
      variables: {emoji, link, description, x, y, theta},
    });
    void refetch();
    return result;
  }, [captureEvent, rawAddEmoji, refetch]);

  const removeEmoji = useCallback(async (id: string) => {
    captureEvent("emojiBannerRemove", {id});
    const result = await rawRemoveEmoji({variables: {id}});
    const newEmojis = result.data?.RemoveBannerEmoji;
    if (Array.isArray(newEmojis)) {
      setEmojis(newEmojis);
    }
    await refetch();
  }, [captureEvent, rawRemoveEmoji, refetch]);

  const onMouseMove = useCallback(({target, clientX, clientY}: MouseEvent) => {
    if (isValidTarget(target, clientX, clientY)) {
      setHoverPos(normalizeCoords(clientX, clientY));
    } else {
      setHoverPos(null);
    }
  }, [normalizeCoords]);

  const onMouseOut = useCallback(() => {
    setHoverPos(null);
  }, []);

  const onClick = useCallback(async ({target, clientX, clientY}: MouseEvent) => {
    captureEvent("emojiBannerClick", {clientX, clientY});
    if ("tagName" in target && target.tagName === "A") {
      return;
    }
    if (!currentUser) {
      onLogin();
      return;
    }
    if (currentUser.banned || !currentUser.reviewedByUserId) {
      flash("Only approved users can add emojis to the banner");
      return;
    }
    if (isValidTarget(target, clientX, clientY)) {
      const coords = normalizeCoords(clientX, clientY);
      if (coords) {
        setInsertPos(coords);
        setHoverPos(null);
      }
    }
  }, [captureEvent, flash, currentUser, onLogin, normalizeCoords]);

  const onCancelInsert = useCallback(() => setInsertPos(null), []);

  const canAddEmoji = !isAddingEmoji;

  return (
    <ForumNoSSR>
      <AnalyticsContext pageSectionContext="ea-emoji-banner">
        <emojiContext.Provider value={{
          currentUser,
          setEmojis,
          addEmoji,
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
            {emojis.map((emoji) => <Emoji key={emoji.id} emoji={emoji} />)}
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
