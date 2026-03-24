import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import classNames from "classnames";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { isEAForum } from "../../lib/instanceSettings";
import { useSubscribedLocation } from "../../lib/routeUtil";
import { EA_FORUM_COMMUNITY_TOPIC_ID } from "../../lib/collections/tags/helpers";
import { getBrowserLocalStorage } from "../editor/localStorageHandlers";
import { useDialog } from "../common/withDialog";
import LoginPopup from "../users/LoginPopup";
import { useCookiePreferences } from "../hooks/useCookiesWithConsent";
import { useConcreteThemeOptions } from "../themes/useTheme";
import {
  sitePetAnimations,
  sitePetSpritePalette,
  type SitePetSpriteGridValue,
} from "./sitePetSprites";

const LEGACY_STORAGE_KEY_PREFIX = "sitePet:v1:";
const STORAGE_KEY_PREFIX = "sitePet:v2:";
const PET_WIDTH = 108;
const PET_HEIGHT = 152;
const SPRITE_SIZE = 18;
const SPRITE_DISPLAY_SIZE = 96;
const EDGE_MARGIN = 0;
const MOBILE_BOTTOM_MARGIN = 80;
const DESKTOP_BOTTOM_MARGIN = 24;
const COOKIE_BANNER_OFFSET_MOBILE = 160;
const COOKIE_BANNER_OFFSET_DESKTOP = 88;
const DRAG_THRESHOLD = 6;
const HUNGER_DECAY_DURATION_MS = 15 * 60 * 1000;
const HUNGER_LIVE_UPDATE_INTERVAL_MS = 15 * 1000;
const HUNGER_PAUSE_AFTER_EATING_MS = 30 * 1000;
const HUNGER_MAX = 100;
const HUNGER_DEFAULT = 100;
const HUNGER_SEGMENT_COUNT = 10;
const HUNGER_SEGMENT_VALUE = HUNGER_MAX / HUNGER_SEGMENT_COUNT;
const HUNGER_REFILL_MULTIPLIER = 4;
const HUNGER_REFILL_MIN = 3;
const HUNGER_REFILL_MAX = 30;
const EATING_ANIMATION_ROUTE_NAMES = new Set([
  "posts.single",
  "events.single",
  "groups.post",
  "sequencesPost",
]);

const SITE_PET_POST_METRICS_QUERY = gql`
  query SitePetPostMetrics($input: SinglePostInput) {
    post(input: $input) {
      result {
        _id
        tagRelevance
        readTimeMinutes
      }
      __typename
    }
  }
`;

type Position = {
  x: number,
  y: number,
};

type SitePetVariant = "egg" | "pet";
type SitePetAnimationMode = "idle" | "eating" | "happy" | "refuse" | "dead";
type HungerSnapshot = {
  hunger: number,
  hungerUpdatedAt: number,
};
type SitePetStoredState = Position & {
  hunger?: number,
  hungerUpdatedAt?: string,
  lastFedPostKey?: string,
};
type SitePetPostMetrics = {
  _id: string,
  tagRelevance: Record<string, number> | null,
  readTimeMinutes: number,
};
type SitePetPostMetricsQueryResult = {
  post?: {
    result?: SitePetPostMetrics | null,
  } | null,
};

const styles = (theme: ThemeType) => ({
  "@keyframes hunger-warning-flash": {
    "0%": {
      opacity: 1,
    },
    "50%": {
      opacity: 0.3,
    },
    "100%": {
      opacity: 1,
    },
  },
  root: {
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: theme.zIndexes.sitePet,
    pointerEvents: "auto",
    transition: "transform 180ms ease-out",
  },
  rootDragging: {
    transition: "none",
  },
  rootHidden: {
    opacity: 0,
    pointerEvents: "none",
  },
  button: {
    border: "none",
    background: "transparent",
    padding: 0,
    width: PET_WIDTH,
    cursor: "grab",
    touchAction: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTapHighlightColor: "transparent",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    outline: "none",
  },
  buttonDragging: {
    cursor: "grabbing",
  },
  artFrame: {
    position: "relative",
    width: PET_WIDTH,
    height: 110,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  hungerMeter: {
    width: 92,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginTop: -2,
  },
  hungerLabel: {
    fontSize: 10,
    lineHeight: "10px",
    fontFamily: "monospace",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: theme.palette.type === "dark" ? theme.palette.text.alwaysWhite : theme.palette.grey[700],
    alignSelf: "flex-start",
  },
  hungerTrack: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: `repeat(${HUNGER_SEGMENT_COUNT}, 1fr)`,
    gap: 2,
  },
  hungerSegment: {
    height: 8,
    boxSizing: "border-box",
    border: `1px solid ${theme.palette.type === "dark" ? theme.palette.grey[500] : theme.palette.grey[400]}`,
    background: "transparent",
  },
  hungerSegmentFilled: {
    background: sitePetSpritePalette.heart,
    borderColor: sitePetSpritePalette.heart,
  },
  hungerSegmentWarning: {
    animation: "hunger-warning-flash .8s steps(2, end) infinite",
  },
  srOnly: {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    width: 1,
  },
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const isValidPosition = (value: unknown): value is Position => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybePosition = value as Partial<Position>;
  return typeof maybePosition.x === "number" && typeof maybePosition.y === "number";
};

const isValidStoredState = (value: unknown): value is SitePetStoredState => {
  if (!isValidPosition(value)) {
    return false;
  }

  const maybeState = value as Partial<SitePetStoredState>;
  const hasValidHunger = maybeState.hunger === undefined || typeof maybeState.hunger === "number";
  const hasValidTimestamp = maybeState.hungerUpdatedAt === undefined || typeof maybeState.hungerUpdatedAt === "string";
  const hasValidLastFedKey = maybeState.lastFedPostKey === undefined || typeof maybeState.lastFedPostKey === "string";

  return hasValidHunger && hasValidTimestamp && hasValidLastFedKey;
};

const clampHunger = (value: number) => clamp(Math.floor(value), 0, HUNGER_MAX);

const createHungerSnapshot = (hunger: number, hungerUpdatedAt: number): HungerSnapshot => ({
  hunger: clampHunger(hunger),
  hungerUpdatedAt,
});

const getDecayedHunger = ({ hunger, hungerUpdatedAt }: HungerSnapshot, now: number) => {
  if (now <= hungerUpdatedAt) {
    return hunger;
  }

  const elapsed = now - hungerUpdatedAt;
  const decay = (elapsed / HUNGER_DECAY_DURATION_MS) * HUNGER_MAX;
  return clampHunger(hunger - decay);
};

const parseStoredTimestamp = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : fallback;
};

const getHungerRefill = (readTimeMinutes: number | null | undefined) => {
  if (typeof readTimeMinutes !== "number") {
    return 0;
  }

  return Math.min(HUNGER_REFILL_MAX, Math.max(HUNGER_REFILL_MIN, readTimeMinutes * HUNGER_REFILL_MULTIPLIER));
};

const getHungerAfterFeeding = (currentHunger: number, refill: number) => {
  if (currentHunger >= HUNGER_MAX) {
    return HUNGER_MAX;
  }

  const currentFilledSegments = Math.floor(currentHunger / HUNGER_SEGMENT_VALUE);
  const minimumVisibleIncrease = Math.min(HUNGER_MAX, (currentFilledSegments + 1) * HUNGER_SEGMENT_VALUE);
  return clampHunger(Math.max(currentHunger + refill, minimumVisibleIncrease));
};

const getFilledHungerSegments = (hunger: number | null) => {
  if (hunger === null || hunger <= 0) {
    return 0;
  }

  return clamp(Math.ceil(hunger / HUNGER_SEGMENT_VALUE), 1, HUNGER_SEGMENT_COUNT);
};

const renderSpriteGrid = (grid: SitePetSpriteGridValue[][], isDarkMode: boolean) => [
  ...grid.flatMap((row, y) => row.flatMap((value, x) => {
    if (value === 0) {
      return [];
    }

    const fill = value === 2
      ? sitePetSpritePalette.heart
      : value === 3
        ? sitePetSpritePalette.sparkle
        : value === 4
          ? sitePetSpritePalette.fill
          : value === 5
            ? isDarkMode ? sitePetSpritePalette.fill : sitePetSpritePalette.body
        : sitePetSpritePalette.body;

    return (
      <rect
        key={`grid-${x}-${y}-${value}`}
        x={x}
        y={y}
        width={1}
        height={1}
        fill={fill}
      />
    );
  })),
];

const SpriteGrid = ({grid, isDarkMode}: {grid: SitePetSpriteGridValue[][], isDarkMode: boolean}) => (
  <svg
    width={SPRITE_DISPLAY_SIZE}
    height={SPRITE_DISPLAY_SIZE}
    viewBox={`0 0 ${SPRITE_SIZE} ${SPRITE_SIZE}`}
    shapeRendering="crispEdges"
    aria-hidden="true"
  >
    {renderSpriteGrid(grid, isDarkMode)}
  </svg>
);

const SitePetCompanion = ({
  currentUser,
  classes,
}: {
  currentUser: UsersCurrent | null,
  classes: ClassesType<typeof styles>,
}) => {
  const concreteThemeOptions = useConcreteThemeOptions();
  const { currentRoute, pathname, params } = useSubscribedLocation();
  const { openDialog } = useDialog();
  const { explicitConsentGiven, explicitConsentRequired } = useCookiePreferences();
  const [position, setPosition] = useState<Position | null>(null);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [animationMode, setAnimationMode] = useState<SitePetAnimationMode>("idle");
  const [happyLoopsRemaining, setHappyLoopsRemaining] = useState(0);
  const [hungerSnapshot, setHungerSnapshot] = useState<HungerSnapshot | null>(null);
  const [lastFedPostKey, setLastFedPostKey] = useState<string | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());
  const [frameIndex, setFrameIndex] = useState(0);
  const pointerStateRef = useRef<{
    pointerId: number,
    startX: number,
    startY: number,
    origin: Position,
  } | null>(null);
  const draggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const lastTriggeredPostPageRef = useRef<string | null>(null);

  const variant: SitePetVariant = currentUser ? "pet" : "egg";
  const isPostPage = (currentRoute?.name && (
    EATING_ANIMATION_ROUTE_NAMES.has(currentRoute.name) ||
    currentRoute.name.endsWith(".posts.single")
  )) ?? false;
  const currentPostId = useMemo(() => {
    if (!isPostPage) {
      return undefined;
    }

    return currentRoute?.name === "sequencesPost" ? params.postId : params._id;
  }, [currentRoute?.name, isPostPage, params._id, params.postId]);
  const postPageKey = isPostPage ? `${currentRoute?.name ?? ""}:${pathname}` : null;
  const { data: currentPostData, loading: currentPostLoading } = useQuery<SitePetPostMetricsQueryResult>(
    SITE_PET_POST_METRICS_QUERY,
    {
      variables: {
        input: {
          selector: {
            documentId: currentPostId,
          },
        },
      },
      ssr: false,
      skip: variant !== "pet" || !currentPostId,
    },
  );
  const currentPost = currentPostData?.post?.result ?? null;
  const currentPostReadTimeMinutes = currentPost?.readTimeMinutes ?? 0;
  const isCommunityPost = !!currentPost?.tagRelevance?.[EA_FORUM_COMMUNITY_TOPIC_ID];
  const displayedHunger = useMemo(
    () => variant === "pet"
      ? getDecayedHunger(hungerSnapshot ?? createHungerSnapshot(HUNGER_DEFAULT, currentTimeMs), currentTimeMs)
      : null,
    [currentTimeMs, hungerSnapshot, variant],
  );
  const filledHungerSegments = useMemo(
    () => getFilledHungerSegments(displayedHunger),
    [displayedHunger],
  );
  const shouldFlashLowHunger = filledHungerSegments === 1;
  const showCookieBanner = explicitConsentRequired === true && !explicitConsentGiven;
  const storageKey = useMemo(
    () => `${STORAGE_KEY_PREFIX}${currentUser?._id ?? "anon"}`,
    [currentUser?._id],
  );
  const showDeadSprite = variant === "pet" && displayedHunger === 0 && animationMode === "idle";
  const activeAnimation = useMemo(
    () => variant === "egg"
      ? sitePetAnimations.egg.idle
      : showDeadSprite
        ? sitePetAnimations.bulby.dead
      : animationMode === "eating"
        ? sitePetAnimations.bulby.eating
        : animationMode === "happy"
          ? sitePetAnimations.bulby.happy
          : animationMode === "refuse"
            ? sitePetAnimations.bulby.refuse
          : animationMode === "dead"
            ? sitePetAnimations.bulby.dead
        : sitePetAnimations.bulby.idle,
    [animationMode, showDeadSprite, variant],
  );
  const currentSpriteGrid = useMemo(() => {
    return activeAnimation.frames[frameIndex % activeAnimation.frames.length];
  }, [activeAnimation, frameIndex]);
  const isDarkMode = concreteThemeOptions.name === "dark";

  const getViewport = useCallback(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }), []);

  const getBottomInset = useCallback(() => {
    const baseInset = window.innerWidth < 1280 ? MOBILE_BOTTOM_MARGIN : DESKTOP_BOTTOM_MARGIN;
    if (!showCookieBanner) {
      return baseInset;
    }

    return baseInset + (window.innerWidth < 600 ? COOKIE_BANNER_OFFSET_MOBILE : COOKIE_BANNER_OFFSET_DESKTOP);
  }, [showCookieBanner]);

  const clampPosition = useCallback((nextPosition: Position) => {
    const viewport = getViewport();
    const maxX = Math.max(EDGE_MARGIN, viewport.width - PET_WIDTH - EDGE_MARGIN);
    const maxY = Math.max(EDGE_MARGIN, viewport.height - PET_HEIGHT - getBottomInset());

    return {
      x: clamp(nextPosition.x, EDGE_MARGIN, maxX),
      y: clamp(nextPosition.y, EDGE_MARGIN, maxY),
    };
  }, [getBottomInset, getViewport]);

  const getDefaultPosition = useCallback(() => {
    const viewport = getViewport();
    return clampPosition({
      x: EDGE_MARGIN,
      y: viewport.height - PET_HEIGHT - getBottomInset(),
    });
  }, [clampPosition, getBottomInset, getViewport]);

  useEffect(() => {
    if (!isEAForum) {
      return;
    }

    const now = Date.now();
    setCurrentTimeMs(now);
    const storage = getBrowserLocalStorage();
    const fallbackPosition = getDefaultPosition();
    const legacyStorageKey = `${LEGACY_STORAGE_KEY_PREFIX}${currentUser?._id ?? "anon"}`;

    if (!storage) {
      setPosition(fallbackPosition);
      setLoadedStorageKey(storageKey);
      if (variant === "pet") {
        setHungerSnapshot(createHungerSnapshot(HUNGER_DEFAULT, now));
        setLastFedPostKey(null);
      } else {
        setHungerSnapshot(null);
        setLastFedPostKey(null);
      }
      return;
    }

    try {
      const rawCurrentValue = storage.getItem(storageKey);
      const rawLegacyValue = rawCurrentValue ? null : storage.getItem(legacyStorageKey);
      const parsedCurrentValue = rawCurrentValue ? JSON.parse(rawCurrentValue) : null;
      const parsedLegacyValue = rawLegacyValue ? JSON.parse(rawLegacyValue) : null;
      const storedValue = isValidStoredState(parsedCurrentValue)
        ? parsedCurrentValue
        : isValidStoredState(parsedLegacyValue)
          ? parsedLegacyValue
          : null;

      setPosition(storedValue ? clampPosition(storedValue) : fallbackPosition);
      if (variant === "pet") {
        if (storedValue && typeof storedValue.hunger === "number") {
          const storedSnapshot = createHungerSnapshot(
            storedValue.hunger,
            parseStoredTimestamp(storedValue.hungerUpdatedAt, now),
          );
          setHungerSnapshot(createHungerSnapshot(getDecayedHunger(storedSnapshot, now), now));
          setLastFedPostKey(storedValue.lastFedPostKey ?? null);
        } else {
          setHungerSnapshot(createHungerSnapshot(HUNGER_DEFAULT, now));
          setLastFedPostKey(null);
        }
      } else {
        setHungerSnapshot(null);
        setLastFedPostKey(null);
      }
      setLoadedStorageKey(storageKey);
    } catch {
      setPosition(fallbackPosition);
      if (variant === "pet") {
        setHungerSnapshot(createHungerSnapshot(HUNGER_DEFAULT, now));
        setLastFedPostKey(null);
      } else {
        setHungerSnapshot(null);
        setLastFedPostKey(null);
      }
      setLoadedStorageKey(storageKey);
    }
  }, [clampPosition, currentUser?._id, getDefaultPosition, storageKey, variant]);

  useEffect(() => {
    if (variant !== "pet") {
      return;
    }

    const syncClock = () => {
      setCurrentTimeMs(Date.now());
    };

    syncClock();
    const interval = window.setInterval(syncClock, HUNGER_LIVE_UPDATE_INTERVAL_MS);
    window.addEventListener("focus", syncClock);
    document.addEventListener("visibilitychange", syncClock);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncClock);
      document.removeEventListener("visibilitychange", syncClock);
    };
  }, [variant]);

  useEffect(() => {
    if (variant !== "pet") {
      return;
    }

    setCurrentTimeMs(Date.now());
  }, [pathname, variant]);

  useEffect(() => {
    setFrameIndex(0);
  }, [activeAnimation]);

  useEffect(() => {
    if (variant === "pet" && animationMode !== "idle") {
      let nextFrameIndex = 1;
      let timeout: number | undefined;
      const advanceAnimation = () => {
        if (nextFrameIndex < activeAnimation.frames.length) {
          setFrameIndex(nextFrameIndex);
          nextFrameIndex += 1;
          timeout = window.setTimeout(advanceAnimation, activeAnimation.frameDurationMs);
          return;
        }

        setAnimationMode((currentMode) => {
          if (currentMode === "eating") {
            setHappyLoopsRemaining(1);
            return "happy";
          }
          if (currentMode === "happy") {
            if (happyLoopsRemaining > 0) {
              setFrameIndex(0);
              setHappyLoopsRemaining(happyLoopsRemaining - 1);
              return "happy";
            }
            return "idle";
          }
          if (currentMode === "refuse") {
            return "idle";
          }
          return currentMode;
        });
      };
      timeout = window.setTimeout(advanceAnimation, activeAnimation.frameDurationMs);

      return () => {
        if (timeout !== undefined) {
          window.clearTimeout(timeout);
        }
      };
    }

    const interval = window.setInterval(() => {
      setFrameIndex((currentFrame) => (currentFrame + 1) % activeAnimation.frames.length);
    }, activeAnimation.frameDurationMs);

    return () => window.clearInterval(interval);
  }, [activeAnimation, animationMode, happyLoopsRemaining, variant]);

  useEffect(() => {
    if (variant !== "pet") {
      setAnimationMode("idle");
      setHappyLoopsRemaining(0);
      lastTriggeredPostPageRef.current = null;
      return;
    }

    if (!postPageKey) {
      setAnimationMode("idle");
      setHappyLoopsRemaining(0);
      lastTriggeredPostPageRef.current = null;
      return;
    }

    if (currentPostLoading || !currentPost) {
      return;
    }

    if (lastTriggeredPostPageRef.current === postPageKey) {
      return;
    }

    lastTriggeredPostPageRef.current = postPageKey;
    const now = Date.now();
    setCurrentTimeMs(now);
    setHappyLoopsRemaining(0);
    if (!isCommunityPost && lastFedPostKey !== postPageKey) {
      const refill = getHungerRefill(currentPostReadTimeMinutes);
      setHungerSnapshot((currentSnapshot) => {
        const currentHunger = currentSnapshot ? getDecayedHunger(currentSnapshot, now) : HUNGER_DEFAULT;
        return createHungerSnapshot(
          getHungerAfterFeeding(currentHunger, refill),
          now + HUNGER_PAUSE_AFTER_EATING_MS,
        );
      });
      setLastFedPostKey(postPageKey);
    }
    setAnimationMode(isCommunityPost ? "refuse" : "eating");
  }, [currentPost, currentPostLoading, currentPostReadTimeMinutes, isCommunityPost, lastFedPostKey, postPageKey, variant]);

  useEffect(() => {
    if (!position || loadedStorageKey !== storageKey) {
      return;
    }

    const storage = getBrowserLocalStorage();
    if (!storage) {
      return;
    }

    try {
      if (variant === "pet" && displayedHunger !== null) {
        const persistedHungerUpdatedAt = hungerSnapshot
          ? Math.max(hungerSnapshot.hungerUpdatedAt, currentTimeMs)
          : currentTimeMs;
        storage.setItem(storageKey, JSON.stringify({
          x: position.x,
          y: position.y,
          hunger: displayedHunger,
          hungerUpdatedAt: new Date(persistedHungerUpdatedAt).toISOString(),
          ...(lastFedPostKey ? { lastFedPostKey } : {}),
        } satisfies SitePetStoredState));
      } else {
        storage.setItem(storageKey, JSON.stringify(position));
      }
    } catch {
      // Ignore localStorage write failures so the overlay still works for the session.
    }
  }, [currentTimeMs, displayedHunger, hungerSnapshot, lastFedPostKey, loadedStorageKey, position, storageKey, variant]);

  useEffect(() => {
    const onResize = () => {
      setPosition((currentPosition) => {
        if (!currentPosition) {
          return currentPosition;
        }

        const nextPosition = clampPosition(currentPosition);
        if (nextPosition.x === currentPosition.x && nextPosition.y === currentPosition.y) {
          return currentPosition;
        }

        return nextPosition;
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampPosition]);

  useEffect(() => {
    setPosition((currentPosition) => {
      if (!currentPosition) {
        return currentPosition;
      }

      const nextPosition = clampPosition(currentPosition);
      if (nextPosition.x === currentPosition.x && nextPosition.y === currentPosition.y) {
        return currentPosition;
      }

      return nextPosition;
    });
  }, [clampPosition, showCookieBanner]);

  const openClaimPrompt = useCallback(() => {
    openDialog({
      name: "LoginPopup",
      contents: ({onClose}) => (
        <LoginPopup
          onClose={onClose}
          startingState="signup"
          signupTitle="Sign up to hatch the egg"
        />
      ),
    });
  }, [openDialog]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    const origin = position ?? getDefaultPosition();
    pointerStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin,
    };
    draggingRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [getDefaultPosition, position]);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const pointerState = pointerStateRef.current;
    if (!pointerState || pointerState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - pointerState.startX;
    const deltaY = event.clientY - pointerState.startY;
    const movedEnough = Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD;

    if (!draggingRef.current && !movedEnough) {
      return;
    }

    if (!draggingRef.current) {
      draggingRef.current = true;
      suppressClickRef.current = true;
      setIsDragging(true);
    }

    setPosition(clampPosition({
      x: pointerState.origin.x + deltaX,
      y: pointerState.origin.y + deltaY,
    }));
  }, [clampPosition]);

  const finishPointerGesture = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const pointerState = pointerStateRef.current;
    if (!pointerState || pointerState.pointerId !== event.pointerId) {
      return;
    }

    pointerStateRef.current = null;
    setIsDragging(false);
    draggingRef.current = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const onClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (variant === "egg") {
      openClaimPrompt();
    }
  }, [openClaimPrompt, variant]);

  if (!isEAForum) {
    return null;
  }

  return (
    <div
      className={classNames(classes.root, {
        [classes.rootDragging]: isDragging,
        [classes.rootHidden]: !position,
      })}
      style={position ? { transform: `translate3d(${position.x}px, ${position.y}px, 0)` } : undefined}
    >
      <button
        type="button"
        className={classNames(classes.button, {
          [classes.buttonDragging]: isDragging,
        })}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointerGesture}
        onPointerCancel={finishPointerGesture}
        aria-label={variant === "egg" ? "Claim your pet" : "Your forum pet"}
      >
        <span className={classes.srOnly}>
          {variant === "egg"
            ? "Create an account to claim your pet"
            : `Your forum pet. Hunger ${displayedHunger ?? HUNGER_DEFAULT} out of ${HUNGER_MAX}.`}
        </span>
        <div className={classes.artFrame}>
          <SpriteGrid grid={currentSpriteGrid} isDarkMode={isDarkMode} />
        </div>
        {variant === "pet" && displayedHunger !== null && (
          <div className={classes.hungerMeter}>
            <span className={classes.hungerLabel}>Hunger</span>
            <div className={classes.hungerTrack} aria-hidden="true">
              {Array.from({length: HUNGER_SEGMENT_COUNT}, (_, index) => (
                <span
                  key={`hunger-segment-${index}`}
                  className={classNames(classes.hungerSegment, {
                    [classes.hungerSegmentFilled]: index < filledHungerSegments,
                    [classes.hungerSegmentWarning]: shouldFlashLowHunger && index === 0,
                  })}
                />
              ))}
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

export default registerComponent("SitePetCompanion", SitePetCompanion, {styles});
