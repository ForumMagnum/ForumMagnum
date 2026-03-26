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
  babyBulbyAnimations,
  babyBulbySpritePalette,
  type BabyBulbySpriteGridValue,
} from "./babyBulbySprites";

const BABY_BULBY_STORAGE_KEY_PREFIX = "babyBulby:v2:";
const LEGACY_BABY_BULBY_STORAGE_KEY_PREFIXES = ["sitePet:v2:", "sitePet:v1:"] as const;
const BABY_BULBY_WIDTH = 108;
const BABY_BULBY_HEIGHT = 152;
const SPRITE_SIZE = 18;
const SPRITE_DISPLAY_SIZE = 96;
const EDGE_MARGIN = 0;
const MOBILE_BOTTOM_MARGIN = 80;
const DESKTOP_BOTTOM_MARGIN = 24;
const COOKIE_BANNER_OFFSET_MOBILE = 160;
const COOKIE_BANNER_OFFSET_DESKTOP = 88;
const DRAG_THRESHOLD = 6;
const HUNGER_DECAY_DURATION_MS = 5 * 60 * 1000;
const HUNGER_LIVE_UPDATE_INTERVAL_MS = 15 * 1000;
const HUNGER_PAUSE_AFTER_EATING_MS = 30 * 1000;
const HUNGER_MAX = 100;
const HUNGER_DEFAULT = 100;
const HUNGER_SEGMENT_COUNT = 10;
const HUNGER_SEGMENT_VALUE = HUNGER_MAX / HUNGER_SEGMENT_COUNT;
const HUNGER_WARNING_SEGMENT_THRESHOLD = 3;
const HUNGER_METER_DELTA_DURATION_MS = 800;
const HUNGER_REFILL_MULTIPLIER = 4;
const HUNGER_REFILL_MIN = 3;
const HUNGER_REFILL_MAX = 30;
const EATING_ANIMATION_ROUTE_NAMES = new Set([
  "posts.single",
  "events.single",
  "groups.post",
  "sequencesPost",
]);

const BABY_BULBY_POST_METRICS_QUERY = gql`
  query BabyBulbyPostMetrics($input: SinglePostInput) {
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

type BabyBulbyStage = "egg" | "bulby";
type BabyBulbyAnimationMode = "idle" | "eating" | "happy" | "refuse" | "shatterDeath" | "dead";
type HungerSnapshot = {
  hunger: number,
  hungerUpdatedAt: number,
};
type HungerMeterDelta = {
  direction: "up" | "down",
  amount: number,
  changedSegmentIndexes: number[],
  useWarningColor: boolean,
};
type BabyBulbyStoredState = Position & {
  hunger?: number,
  hungerUpdatedAt?: string,
  lastFedPostKey?: string,
};
type BabyBulbyPostMetrics = {
  _id: string,
  tagRelevance: Record<string, number> | null,
  readTimeMinutes: number,
};
type BabyBulbyPostMetricsQueryResult = {
  post?: {
    result?: BabyBulbyPostMetrics | null,
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
  "@keyframes hunger-segment-gain": {
    "0%": {
      opacity: 0.5,
      transform: "scale(0.82)",
      filter: "brightness(1.35)",
    },
    "50%": {
      opacity: 1,
      transform: "scale(1.08)",
      filter: "brightness(1.15)",
    },
    "100%": {
      opacity: 1,
      transform: "scale(1)",
      filter: "brightness(1)",
    },
  },
  "@keyframes hunger-segment-loss": {
    "0%": {
      opacity: 1,
      transform: "scale(1)",
    },
    "35%": {
      opacity: 0.2,
    },
    "60%": {
      opacity: 1,
    },
    "100%": {
      opacity: 0,
      transform: "scale(0.88)",
    },
  },
  "@keyframes hunger-delta-fade": {
    "0%": {
      opacity: 0,
      transform: "translateY(1px)",
    },
    "20%": {
      opacity: 1,
      transform: "translateY(0)",
    },
    "100%": {
      opacity: 0,
      transform: "translateY(-1px)",
    },
  },
  root: {
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: theme.zIndexes.babyBulby,
    pointerEvents: "auto",
    transition: "transform 180ms ease-out",
  },
  rootDragging: {
    transition: "none",
  },
  rootStatic: {
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
    width: BABY_BULBY_WIDTH,
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
    width: BABY_BULBY_WIDTH,
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
  hungerLabelRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    minHeight: 10,
  },
  hungerLabel: {
    fontSize: 10,
    lineHeight: "10px",
    fontFamily: "monospace",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: theme.palette.type === "dark" ? theme.palette.text.alwaysWhite : theme.palette.grey[700],
  },
  hungerDelta: {
    fontSize: 10,
    lineHeight: "10px",
    fontFamily: "monospace",
    fontWeight: 700,
    animation: `hunger-delta-fade ${HUNGER_METER_DELTA_DURATION_MS}ms steps(4, end) forwards`,
  },
  hungerDeltaUp: {
    color: theme.palette.primary.main,
  },
  hungerDeltaDown: {
    color: babyBulbySpritePalette.heart,
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
    cursor: "pointer",
    transformOrigin: "center",
  },
  hungerSegmentFilledHealthy: {
    background: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
  },
  hungerSegmentFilledWarning: {
    background: babyBulbySpritePalette.heart,
    borderColor: babyBulbySpritePalette.heart,
  },
  hungerSegmentWarning: {
    animation: "hunger-warning-flash .8s steps(2, end) infinite",
  },
  hungerSegmentGain: {
    animation: `hunger-segment-gain ${HUNGER_METER_DELTA_DURATION_MS}ms steps(4, end)`,
  },
  hungerSegmentLoss: {
    animation: `hunger-segment-loss ${HUNGER_METER_DELTA_DURATION_MS}ms steps(4, end) forwards`,
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

const isValidStoredState = (value: unknown): value is BabyBulbyStoredState => {
  if (!isValidPosition(value)) {
    return false;
  }

  const maybeState = value as Partial<BabyBulbyStoredState>;
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

const getAwayClampedHunger = (snapshot: HungerSnapshot, now: number) => {
  if (snapshot.hunger <= 0) {
    return 0;
  }

  const decayedHunger = getDecayedHunger(snapshot, now);
  const minimumAwayHunger = Math.min(snapshot.hunger, HUNGER_SEGMENT_VALUE);
  return Math.max(decayedHunger, minimumAwayHunger);
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

const getFilledHungerSegments = (hunger: number | null) => {
  if (hunger === null || hunger <= 0) {
    return 0;
  }

  return clamp(Math.ceil(hunger / HUNGER_SEGMENT_VALUE), 1, HUNGER_SEGMENT_COUNT);
};

const getHungerAfterFeeding = (currentHunger: number, refill: number) => {
  if (currentHunger >= HUNGER_MAX) {
    return HUNGER_MAX;
  }

  const currentFilledSegments = getFilledHungerSegments(currentHunger);
  const minimumVisibleIncrease = currentFilledSegments === 0
    ? 1
    : Math.min(HUNGER_MAX, (currentFilledSegments * HUNGER_SEGMENT_VALUE) + 1);
  return clampHunger(Math.max(currentHunger + refill, minimumVisibleIncrease));
};

const getChangedSegmentIndexes = (previousFilledSegments: number, nextFilledSegments: number) => {
  if (previousFilledSegments === nextFilledSegments) {
    return [];
  }

  if (nextFilledSegments > previousFilledSegments) {
    return Array.from(
      {length: nextFilledSegments - previousFilledSegments},
      (_, index) => previousFilledSegments + index,
    );
  }

  return Array.from(
    {length: previousFilledSegments - nextFilledSegments},
    (_, index) => nextFilledSegments + index,
  );
};

const renderSpriteGrid = (grid: BabyBulbySpriteGridValue[][], isDarkMode: boolean) => [
  ...grid.flatMap((row, y) => row.flatMap((value, x) => {
    if (value === 0) {
      return [];
    }

    const fill = value === 2
      ? babyBulbySpritePalette.heart
      : value === 3
        ? babyBulbySpritePalette.sparkle
        : value === 4
          ? babyBulbySpritePalette.fill
          : value === 5
            ? isDarkMode ? babyBulbySpritePalette.fill : babyBulbySpritePalette.body
        : babyBulbySpritePalette.body;

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

const SpriteGrid = ({grid, isDarkMode}: {grid: BabyBulbySpriteGridValue[][], isDarkMode: boolean}) => (
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

const BabyBulby = ({
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
  const [hasCompletedInitialPlacement, setHasCompletedInitialPlacement] = useState(false);
  const [animationMode, setAnimationMode] = useState<BabyBulbyAnimationMode>("idle");
  const [happyLoopsRemaining, setHappyLoopsRemaining] = useState(0);
  const [hungerSnapshot, setHungerSnapshot] = useState<HungerSnapshot | null>(null);
  const [lastFedPostKey, setLastFedPostKey] = useState<string | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());
  const [frameIndex, setFrameIndex] = useState(0);
  const [hungerMeterDelta, setHungerMeterDelta] = useState<HungerMeterDelta | null>(null);
  const pointerStateRef = useRef<{
    pointerId: number,
    startX: number,
    startY: number,
    origin: Position,
  } | null>(null);
  const draggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const lastTriggeredPostPageRef = useRef<string | null>(null);
  const previousFilledHungerSegmentsRef = useRef<number | null>(null);
  const hungerMeterDeltaTimeoutRef = useRef<number | null>(null);
  const previousIsDeadRef = useRef<boolean | null>(null);

  const displayStage: BabyBulbyStage = currentUser ? "bulby" : "egg";
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
  const { data: currentPostData, loading: currentPostLoading } = useQuery<BabyBulbyPostMetricsQueryResult>(
    BABY_BULBY_POST_METRICS_QUERY,
    {
      variables: {
        input: {
          selector: {
            documentId: currentPostId,
          },
        },
      },
      ssr: false,
      skip: displayStage !== "bulby" || !currentPostId,
    },
  );
  const currentPost = currentPostData?.post?.result ?? null;
  const currentPostReadTimeMinutes = currentPost?.readTimeMinutes ?? 0;
  const isCommunityPost = !!currentPost?.tagRelevance?.[EA_FORUM_COMMUNITY_TOPIC_ID];
  const displayedHunger = useMemo(
    () => displayStage === "bulby" && hungerSnapshot
      ? getDecayedHunger(hungerSnapshot, currentTimeMs)
      : null,
    [currentTimeMs, hungerSnapshot, displayStage],
  );
  const filledHungerSegments = useMemo(
    () => getFilledHungerSegments(displayedHunger),
    [displayedHunger],
  );
  const useWarningHungerColor = filledHungerSegments > 0 && filledHungerSegments <= HUNGER_WARNING_SEGMENT_THRESHOLD;
  const shouldFlashLowHunger = filledHungerSegments === 1;
  const hungerMeterDeltaIndexes = useMemo(
    () => new Set(hungerMeterDelta?.changedSegmentIndexes ?? []),
    [hungerMeterDelta],
  );
  const showCookieBanner = explicitConsentRequired === true && !explicitConsentGiven;
  const storageKey = useMemo(
    () => `${BABY_BULBY_STORAGE_KEY_PREFIX}${currentUser?._id ?? "anon"}`,
    [currentUser?._id],
  );
  const isStateHydrated = !!position && loadedStorageKey === storageKey && (displayStage === "egg" || hungerSnapshot !== null);
  const isDead = displayStage === "bulby" && displayedHunger === 0;
  const activeAnimation = useMemo(
    () => displayStage === "egg"
      ? babyBulbyAnimations.egg.idle
      : isDead
        ? babyBulbyAnimations.babyBulby.dead
      : animationMode === "eating"
        ? babyBulbyAnimations.babyBulby.eating
        : animationMode === "happy"
          ? babyBulbyAnimations.babyBulby.happy
          : animationMode === "refuse"
            ? babyBulbyAnimations.babyBulby.refuse
          : animationMode === "shatterDeath"
            ? babyBulbyAnimations.babyBulby.shatterDeath
          : animationMode === "dead"
            ? babyBulbyAnimations.babyBulby.dead
          : filledHungerSegments === 1
            ? babyBulbyAnimations.babyBulby.sick
            : babyBulbyAnimations.babyBulby.idle,
    [animationMode, filledHungerSegments, displayStage, isDead],
  );
  const currentSpriteGrid = useMemo(() => {
    if (animationMode === "dead") {
      return activeAnimation.frames[activeAnimation.frames.length - 1];
    }

    return activeAnimation.frames[frameIndex % activeAnimation.frames.length];
  }, [activeAnimation, animationMode, frameIndex]);
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
    const maxX = Math.max(EDGE_MARGIN, viewport.width - BABY_BULBY_WIDTH - EDGE_MARGIN);
    const maxY = Math.max(EDGE_MARGIN, viewport.height - BABY_BULBY_HEIGHT - getBottomInset());

    return {
      x: clamp(nextPosition.x, EDGE_MARGIN, maxX),
      y: clamp(nextPosition.y, EDGE_MARGIN, maxY),
    };
  }, [getBottomInset, getViewport]);

  const getDefaultPosition = useCallback(() => {
    const viewport = getViewport();
    return clampPosition({
      x: EDGE_MARGIN,
      y: viewport.height - BABY_BULBY_HEIGHT - getBottomInset(),
    });
  }, [clampPosition, getBottomInset, getViewport]);

  const syncHungerFromAway = useCallback((now: number) => {
    setCurrentTimeMs(now);
    setHungerSnapshot((currentSnapshot) => {
      if (!currentSnapshot) {
        return currentSnapshot;
      }

      return createHungerSnapshot(getAwayClampedHunger(currentSnapshot, now), now);
    });
  }, []);

  useEffect(() => {
    if (!isStateHydrated) {
      setHasCompletedInitialPlacement(false);
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      setHasCompletedInitialPlacement(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [isStateHydrated]);

  useEffect(() => {
    if (!isEAForum) {
      return;
    }

    const now = Date.now();
    setCurrentTimeMs(now);
    const storage = getBrowserLocalStorage();
    const fallbackPosition = getDefaultPosition();
    const legacyStorageKeys = LEGACY_BABY_BULBY_STORAGE_KEY_PREFIXES.map(
      (prefix) => `${prefix}${currentUser?._id ?? "anon"}`,
    );

    if (!storage) {
      setPosition(fallbackPosition);
      setLoadedStorageKey(storageKey);
      if (displayStage === "bulby") {
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
      const rawLegacyValue = rawCurrentValue
        ? null
        : legacyStorageKeys
          .map((legacyStorageKey) => storage.getItem(legacyStorageKey))
          .find((value) => value !== null) ?? null;
      const parsedCurrentValue = rawCurrentValue ? JSON.parse(rawCurrentValue) : null;
      const parsedLegacyValue = rawLegacyValue ? JSON.parse(rawLegacyValue) : null;
      const storedValue = isValidStoredState(parsedCurrentValue)
        ? parsedCurrentValue
        : isValidStoredState(parsedLegacyValue)
          ? parsedLegacyValue
          : null;

      setPosition(storedValue ? clampPosition(storedValue) : fallbackPosition);
      if (displayStage === "bulby") {
        if (storedValue && typeof storedValue.hunger === "number") {
          const storedSnapshot = createHungerSnapshot(
            storedValue.hunger,
            parseStoredTimestamp(storedValue.hungerUpdatedAt, now),
          );
          setHungerSnapshot(createHungerSnapshot(getAwayClampedHunger(storedSnapshot, now), now));
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
      if (displayStage === "bulby") {
        setHungerSnapshot(createHungerSnapshot(HUNGER_DEFAULT, now));
        setLastFedPostKey(null);
      } else {
        setHungerSnapshot(null);
        setLastFedPostKey(null);
      }
      setLoadedStorageKey(storageKey);
    }
  }, [clampPosition, currentUser?._id, getDefaultPosition, storageKey, displayStage]);

  useEffect(() => {
    if (displayStage !== "bulby") {
      return;
    }

    let interval: number | null = null;

    const clearLiveUpdates = () => {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
    };

    const syncClock = () => {
      setCurrentTimeMs(Date.now());
    };

    const isSiteActive = () => document.visibilityState === "visible" && document.hasFocus();

    const refreshDecayMode = () => {
      const now = Date.now();
      if (isSiteActive()) {
        syncHungerFromAway(now);
        if (interval === null) {
          interval = window.setInterval(syncClock, HUNGER_LIVE_UPDATE_INTERVAL_MS);
        }
        return;
      }

      clearLiveUpdates();
      setCurrentTimeMs(now);
    };

    refreshDecayMode();
    window.addEventListener("focus", refreshDecayMode);
    window.addEventListener("blur", refreshDecayMode);
    document.addEventListener("visibilitychange", refreshDecayMode);

    return () => {
      clearLiveUpdates();
      window.removeEventListener("focus", refreshDecayMode);
      window.removeEventListener("blur", refreshDecayMode);
      document.removeEventListener("visibilitychange", refreshDecayMode);
    };
  }, [syncHungerFromAway, displayStage]);

  useEffect(() => {
    if (displayStage !== "bulby") {
      return;
    }

    setCurrentTimeMs(Date.now());
  }, [pathname, displayStage]);

  useEffect(() => {
    if (displayStage !== "bulby" || displayedHunger !== 0 || !hungerSnapshot || hungerSnapshot.hunger === 0) {
      return;
    }

    setHungerSnapshot(createHungerSnapshot(0, currentTimeMs));
  }, [currentTimeMs, displayedHunger, hungerSnapshot, displayStage]);

  useEffect(() => {
    if (displayStage !== "bulby" || !isStateHydrated) {
      previousFilledHungerSegmentsRef.current = null;
      setHungerMeterDelta(null);
      if (hungerMeterDeltaTimeoutRef.current !== null) {
        window.clearTimeout(hungerMeterDeltaTimeoutRef.current);
        hungerMeterDeltaTimeoutRef.current = null;
      }
      return;
    }

    const previousFilledHungerSegments = previousFilledHungerSegmentsRef.current;
    previousFilledHungerSegmentsRef.current = filledHungerSegments;

    if (previousFilledHungerSegments === null || previousFilledHungerSegments === filledHungerSegments) {
      return;
    }

    const direction = filledHungerSegments > previousFilledHungerSegments ? "up" : "down";
    const changedSegmentIndexes = getChangedSegmentIndexes(previousFilledHungerSegments, filledHungerSegments);
    const nextMeterDelta: HungerMeterDelta = {
      direction,
      amount: Math.abs(filledHungerSegments - previousFilledHungerSegments),
      changedSegmentIndexes,
      useWarningColor: direction === "up"
        ? filledHungerSegments <= HUNGER_WARNING_SEGMENT_THRESHOLD
        : previousFilledHungerSegments <= HUNGER_WARNING_SEGMENT_THRESHOLD,
    };

    setHungerMeterDelta(nextMeterDelta);

    if (hungerMeterDeltaTimeoutRef.current !== null) {
      window.clearTimeout(hungerMeterDeltaTimeoutRef.current);
    }

    hungerMeterDeltaTimeoutRef.current = window.setTimeout(() => {
      setHungerMeterDelta(null);
      hungerMeterDeltaTimeoutRef.current = null;
    }, HUNGER_METER_DELTA_DURATION_MS);
  }, [filledHungerSegments, displayStage, isStateHydrated]);

  useEffect(() => () => {
    if (hungerMeterDeltaTimeoutRef.current !== null) {
      window.clearTimeout(hungerMeterDeltaTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (displayStage !== "bulby") {
      previousIsDeadRef.current = null;
      return;
    }

    const previousIsDead = previousIsDeadRef.current;
    previousIsDeadRef.current = isDead;

    if (!isDead) {
      if (animationMode === "dead" || animationMode === "shatterDeath") {
        setAnimationMode("idle");
      }
      return;
    }

    if (animationMode === "dead" || animationMode === "shatterDeath") {
      return;
    }

    setAnimationMode("dead");
  }, [animationMode, isDead, displayStage]);

  useEffect(() => {
    setFrameIndex(0);
  }, [activeAnimation]);

  useEffect(() => {
    if (displayStage === "bulby" && animationMode === "dead") {
      setFrameIndex(activeAnimation.frames.length - 1);
      return;
    }

    if (displayStage === "bulby" && animationMode !== "idle") {
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
          if (currentMode === "shatterDeath") {
            setFrameIndex(activeAnimation.frames.length - 1);
            return "dead";
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
  }, [activeAnimation, animationMode, happyLoopsRemaining, displayStage]);

  useEffect(() => {
    if (displayStage !== "bulby") {
      setAnimationMode("idle");
      setHappyLoopsRemaining(0);
      lastTriggeredPostPageRef.current = null;
      return;
    }

    if (!isStateHydrated) {
      return;
    }

    if (isDead) {
      setHappyLoopsRemaining(0);
      lastTriggeredPostPageRef.current = postPageKey;
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
  }, [currentPost, currentPostLoading, currentPostReadTimeMinutes, isCommunityPost, isDead, isStateHydrated, lastFedPostKey, postPageKey, displayStage]);

  useEffect(() => {
    if (!position || loadedStorageKey !== storageKey) {
      return;
    }

    if (displayStage === "bulby" && !hungerSnapshot) {
      return;
    }

    const storage = getBrowserLocalStorage();
    if (!storage) {
      return;
    }

    try {
      if (displayStage === "bulby" && displayedHunger !== null) {
        const persistedHungerUpdatedAt = hungerSnapshot
          ? Math.max(hungerSnapshot.hungerUpdatedAt, currentTimeMs)
          : currentTimeMs;
        storage.setItem(storageKey, JSON.stringify({
          x: position.x,
          y: position.y,
          hunger: displayedHunger,
          hungerUpdatedAt: new Date(persistedHungerUpdatedAt).toISOString(),
          ...(lastFedPostKey ? { lastFedPostKey } : {}),
        } satisfies BabyBulbyStoredState));
      } else {
        storage.setItem(storageKey, JSON.stringify(position));
      }
    } catch {
      // Ignore localStorage write failures so the overlay still works for the session.
    }
  }, [currentTimeMs, displayedHunger, hungerSnapshot, lastFedPostKey, loadedStorageKey, position, storageKey, displayStage]);

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
          signupTitle="Sign up to hatch Baby Bulby"
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

    if (displayStage === "egg") {
      openClaimPrompt();
    }
  }, [openClaimPrompt, displayStage]);

  const setTestHungerFromSegment = useCallback((segmentIndex: number) => {
    if (displayStage !== "bulby") {
      return;
    }

    const now = Date.now();
    setCurrentTimeMs(now);
    setHungerSnapshot(createHungerSnapshot((segmentIndex + 1) * HUNGER_SEGMENT_VALUE, now));
  }, [displayStage]);

  const onHungerSegmentPointerDown = useCallback((event: React.PointerEvent<HTMLSpanElement>, segmentIndex: number) => {
    event.preventDefault();
    event.stopPropagation();

    pointerStateRef.current = null;
    draggingRef.current = false;
    setIsDragging(false);
    setTestHungerFromSegment(segmentIndex);
  }, [setTestHungerFromSegment]);

  const onHungerSegmentClick = useCallback((event: React.MouseEvent<HTMLSpanElement>, segmentIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    setTestHungerFromSegment(segmentIndex);
  }, [setTestHungerFromSegment]);

  if (!isEAForum) {
    return null;
  }

  return (
    <div
      className={classNames(classes.root, {
        [classes.rootDragging]: isDragging,
        [classes.rootStatic]: !hasCompletedInitialPlacement,
        [classes.rootHidden]: !isStateHydrated,
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
        aria-label={displayStage === "egg" ? "Claim Baby Bulby" : "Your Baby Bulby"}
      >
        <span className={classes.srOnly}>
          {displayStage === "egg"
            ? "Create an account to claim Baby Bulby"
            : `Your Baby Bulby. Hunger ${displayedHunger ?? HUNGER_DEFAULT} out of ${HUNGER_MAX}.`}
        </span>
        <div className={classes.artFrame}>
          <SpriteGrid grid={currentSpriteGrid} isDarkMode={isDarkMode} />
        </div>
        {displayStage === "bulby" && displayedHunger !== null && (
          <div className={classes.hungerMeter}>
            <div className={classes.hungerLabelRow}>
              <span className={classes.hungerLabel}>Hunger</span>
              {hungerMeterDelta && (
                <span
                  className={classNames(classes.hungerDelta, {
                    [classes.hungerDeltaUp]: hungerMeterDelta.direction === "up",
                    [classes.hungerDeltaDown]: hungerMeterDelta.direction === "down",
                  })}
                >
                  {`${hungerMeterDelta.direction === "up" ? "+" : "-"}${hungerMeterDelta.amount}`}
                </span>
              )}
            </div>
            <div className={classes.hungerTrack} aria-hidden="true">
              {Array.from({length: HUNGER_SEGMENT_COUNT}, (_, index) => (
                (() => {
                  const isFilled = index < filledHungerSegments;
                  const isGainedSegment = hungerMeterDelta?.direction === "up" && hungerMeterDeltaIndexes.has(index);
                  const isLostSegment = hungerMeterDelta?.direction === "down" && hungerMeterDeltaIndexes.has(index);
                  const shouldUseWarningColor = isLostSegment
                    ? !!hungerMeterDelta?.useWarningColor
                    : useWarningHungerColor;
                  const shouldApplyGenericMeterAnimation = !(shouldFlashLowHunger && index === 0);

                  return (
                    <span
                      key={`hunger-segment-${index}`}
                      className={classNames(classes.hungerSegment, {
                        [classes.hungerSegmentFilledHealthy]: (isFilled || isLostSegment) && !shouldUseWarningColor,
                        [classes.hungerSegmentFilledWarning]: (isFilled || isLostSegment) && shouldUseWarningColor,
                        [classes.hungerSegmentWarning]: shouldFlashLowHunger && index === 0,
                        [classes.hungerSegmentGain]: isGainedSegment && shouldApplyGenericMeterAnimation,
                        [classes.hungerSegmentLoss]: isLostSegment && shouldApplyGenericMeterAnimation,
                      })}
                      onPointerDown={(event) => onHungerSegmentPointerDown(event, index)}
                      onClick={(event) => onHungerSegmentClick(event, index)}
                      title={`Set hunger to bar ${index + 1}`}
                    />
                  );
                })()
              ))}
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

export default registerComponent("BabyBulby", BabyBulby, {styles});
