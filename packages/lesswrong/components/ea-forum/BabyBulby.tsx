import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import classNames from "classnames";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { isEAForum } from "../../lib/instanceSettings";
import { useSubscribedLocation } from "../../lib/routeUtil";
import { EA_FORUM_COMMUNITY_TOPIC_ID } from "../../lib/collections/tags/helpers";
import { useRefetchCurrentUser } from "../common/withUser";
import { getBrowserLocalStorage } from "../editor/localStorageHandlers";
import { useCookiePreferences } from "../hooks/useCookiesWithConsent";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useConcreteThemeOptions } from "../themes/useTheme";
import {
  BABY_BULBY_SPRITE_PIXELS,
  babyBulbyAnimations,
  babyBulbySpritePalette,
  type BabyBulbyAnimationMode,
  type BabyBulbySpriteGridValue,
} from "./babyBulbySprites";

const BABY_BULBY_STORAGE_KEY_PREFIX = "babyBulby:v2:";
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
    }
  }
`;

type Position = {
  x: number,
  y: number,
};

type BabyBulbyStage = "egg" | "bulby";
type HungerSnapshot = {
  hunger: number,
  hungerUpdatedAt: number,
  pauseUntil: number | null,
  updatedAt: number,
};
type HungerMeterDelta = {
  direction: "up" | "down",
  amount: number,
  changedSegmentIndexes: number[],
  useWarningColor: boolean,
};
type BabyBulbyDbState = {
  hunger: number,
  hungerUpdatedAt: string,
  pauseUntil?: string | null,
  updatedAt: string,
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

type BabyBulbyAnimationName = keyof typeof babyBulbyAnimations.babyBulby;

const getActiveAnimationName = (
  animationMode: BabyBulbyAnimationMode,
  isDead: boolean,
  filledHungerSegments: number,
): BabyBulbyAnimationName => {
  if (isDead || animationMode === "dead") {
    return "dead";
  }

  if (animationMode === "eating" || animationMode === "happy" || animationMode === "refuse") {
    return animationMode;
  }

  return filledHungerSegments === 1 ? "sick" : "idle";
};

const getDisplayStage = (currentUser: UsersCurrent | null): BabyBulbyStage => currentUser ? "bulby" : "egg";

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

const clampHunger = (value: number) => clamp(Math.floor(value), 0, HUNGER_MAX);

const parseTimestamp = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" || value instanceof Date) {
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : fallback;
  }

  return fallback;
};

const isValidBabyBulbyDbState = (value: unknown): value is BabyBulbyDbState => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeState = value as Partial<BabyBulbyDbState>;
  return typeof maybeState.hunger === "number"
    && typeof maybeState.hungerUpdatedAt === "string"
    && typeof maybeState.updatedAt === "string"
    && (maybeState.pauseUntil === undefined || maybeState.pauseUntil === null || typeof maybeState.pauseUntil === "string");
};

const createHungerSnapshot = (
  hunger: number,
  hungerUpdatedAt: number,
  pauseUntil: number | null = null,
  updatedAt: number = hungerUpdatedAt,
): HungerSnapshot => ({
  hunger: clampHunger(hunger),
  hungerUpdatedAt,
  pauseUntil,
  updatedAt,
});

const getDecayStartTime = ({ hungerUpdatedAt, pauseUntil }: HungerSnapshot) => Math.max(hungerUpdatedAt, pauseUntil ?? hungerUpdatedAt);

const getDecayedHunger = (snapshot: HungerSnapshot, now: number) => {
  const decayStartTime = getDecayStartTime(snapshot);

  if (now <= decayStartTime) {
    return snapshot.hunger;
  }

  const elapsed = now - decayStartTime;
  const decay = (elapsed / HUNGER_DECAY_DURATION_MS) * HUNGER_MAX;
  return clampHunger(snapshot.hunger - decay);
};

const normalizeHungerSnapshot = (
  snapshot: HungerSnapshot,
  now: number,
  {
    clampAway = false,
    preserveUpdatedAt = true,
  }: {
    clampAway?: boolean,
    preserveUpdatedAt?: boolean,
  } = {},
) => {
  // Product rule: Bulby can die during an active session, but an alive Bulby should not
  // disappear off-screen while the user is away. Away-sync therefore clamps alive state
  // to at least one visible bar; only an already-dead Bulby is allowed to persist as zero.
  if (snapshot.hunger <= 0) {
    return createHungerSnapshot(0, now, null, preserveUpdatedAt ? snapshot.updatedAt : now);
  }

  const decayStartTime = getDecayStartTime(snapshot);

  if (now <= decayStartTime) {
    return createHungerSnapshot(
      snapshot.hunger,
      snapshot.hungerUpdatedAt,
      snapshot.pauseUntil && snapshot.pauseUntil > now ? snapshot.pauseUntil : null,
      preserveUpdatedAt ? snapshot.updatedAt : now,
    );
  }

  const decayedHunger = getDecayedHunger(snapshot, now);
  const hunger = clampAway
    ? Math.max(decayedHunger, Math.min(snapshot.hunger, HUNGER_SEGMENT_VALUE))
    : decayedHunger;

  return createHungerSnapshot(hunger, now, null, preserveUpdatedAt ? snapshot.updatedAt : now);
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

const createSnapshotFromDbState = (value: BabyBulbyDbState, now: number) => normalizeHungerSnapshot(
  createHungerSnapshot(
    value.hunger,
    parseTimestamp(value.hungerUpdatedAt, now),
    value.pauseUntil ? parseTimestamp(value.pauseUntil, now) : null,
    parseTimestamp(value.updatedAt, now),
  ),
  now,
  { clampAway: true, preserveUpdatedAt: true },
);

const snapshotToDbState = (snapshot: HungerSnapshot): BabyBulbyDbState => ({
  hunger: snapshot.hunger,
  hungerUpdatedAt: new Date(snapshot.hungerUpdatedAt).toISOString(),
  ...(snapshot.pauseUntil ? { pauseUntil: new Date(snapshot.pauseUntil).toISOString() } : {}),
  updatedAt: new Date(snapshot.updatedAt).toISOString(),
});

const getDbStateComparableKey = (snapshot: HungerSnapshot | BabyBulbyDbState) => JSON.stringify({
  hunger: snapshot.hunger,
  hungerUpdatedAt: parseTimestamp(snapshot.hungerUpdatedAt, 0),
  pauseUntil: "pauseUntil" in snapshot && snapshot.pauseUntil
    ? parseTimestamp(snapshot.pauseUntil, 0)
    : null,
});

const getSpritePixelFill = (value: BabyBulbySpriteGridValue, isDarkMode: boolean) => {
  switch (value) {
  case BABY_BULBY_SPRITE_PIXELS.heart:
    return babyBulbySpritePalette.heart;
  case BABY_BULBY_SPRITE_PIXELS.sparkle:
    return babyBulbySpritePalette.sparkle;
  case BABY_BULBY_SPRITE_PIXELS.fill:
    return babyBulbySpritePalette.fill;
  case BABY_BULBY_SPRITE_PIXELS.darkModePellet:
  case BABY_BULBY_SPRITE_PIXELS.darkModeSkull:
    return isDarkMode ? babyBulbySpritePalette.fill : babyBulbySpritePalette.body;
  case BABY_BULBY_SPRITE_PIXELS.outline:
  default:
    return babyBulbySpritePalette.body;
  }
};

const renderSpriteGrid = (grid: BabyBulbySpriteGridValue[][], isDarkMode: boolean) => [
  ...grid.flatMap((row, y) => row.flatMap((value, x) => {
    if (value === BABY_BULBY_SPRITE_PIXELS.transparent) {
      return [];
    }

    return (
      <rect
        key={`grid-${x}-${y}-${value}`}
        x={x}
        y={y}
        width={1}
        height={1}
        fill={getSpritePixelFill(value, isDarkMode)}
      />
    );
  })),
];

const SpriteGrid = React.memo(({grid, isDarkMode}: {grid: BabyBulbySpriteGridValue[][], isDarkMode: boolean}) => {
  const spriteRects = useMemo(
    () => renderSpriteGrid(grid, isDarkMode),
    [grid, isDarkMode],
  );

  return (
    <svg
      width={SPRITE_DISPLAY_SIZE}
      height={SPRITE_DISPLAY_SIZE}
      viewBox={`0 0 ${SPRITE_SIZE} ${SPRITE_SIZE}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {spriteRects}
    </svg>
  );
});

const BabyBulby = ({
  currentUser,
  classes,
}: {
  currentUser: UsersCurrent | null,
  classes: ClassesType<typeof styles>,
}) => {
  const concreteThemeOptions = useConcreteThemeOptions();
  const { currentRoute, pathname, params } = useSubscribedLocation();
  const refetchCurrentUser = useRefetchCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const { explicitConsentGiven, explicitConsentRequired } = useCookiePreferences();
  const isAdminViewer = !!currentUser?.isAdmin;
  const [position, setPosition] = useState<Position | null>(null);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasCompletedInitialPlacement, setHasCompletedInitialPlacement] = useState(false);
  const [animationMode, setAnimationMode] = useState<BabyBulbyAnimationMode>("idle");
  const [hungerSnapshot, setHungerSnapshot] = useState<HungerSnapshot | null>(null);
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
  const hungerSnapshotRef = useRef<HungerSnapshot | null>(null);
  const lastPersistedStateKeyRef = useRef<string | null>(null);
  const pendingPersistOptionsRef = useRef<{clampAway: boolean, refetchAfter: boolean} | null>(null);
  const persistInFlightRef = useRef(false);
  const bootstrapRequestedRef = useRef(false);
  const awaySyncCompletedRef = useRef(false);

  /*
   * Admin-only soft launch: keep the live runtime path Bulby-only for now.
   * The admin gate still hides the egg path in this branch, but keep displayStage
   * as a real union so the full-release PR can re-enable egg behavior without
   * first untangling Bulby-only type narrowing.
   *
   * Full-release checklist:
   * 1. Widen the mount gate in Layout so logged-out users can see the egg and non-admins can see Bulby.
   * 2. Restore the egg click/signup handler and the egg-specific screenreader copy below.
   * 3. Decide whether the admin hunger-meter cheat should be deleted or hidden behind an explicit debug flag.
   * 4. Revisit whether dormant egg-only comments can be replaced with live code again.
   */
  const displayStage = getDisplayStage(currentUser);
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
      skip: !isAdminViewer || !currentPostId,
    },
  );
  const currentPost = currentPostData?.post?.result ?? null;
  const currentPostReadTimeMinutes = currentPost?.readTimeMinutes ?? 0;
  const isCommunityPost = !!currentPost?.tagRelevance?.[EA_FORUM_COMMUNITY_TOPIC_ID];
  const serverBabyBulbyState = useMemo(() => (
    isValidBabyBulbyDbState(currentUser?.babyBulbyState)
      ? currentUser.babyBulbyState
      : null
  ), [currentUser?.babyBulbyState]);
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
  const activeAnimationName = useMemo(
    () => getActiveAnimationName(animationMode, isDead, filledHungerSegments),
    [animationMode, filledHungerSegments, isDead],
  );
  const activeAnimation = useMemo(
    () => babyBulbyAnimations.babyBulby[activeAnimationName],
    [activeAnimationName],
  );
  const currentSpriteGrid = useMemo(() => {
    const sequencePosition = activeAnimation.loop
      ? frameIndex % activeAnimation.playOrder.length
      : Math.min(frameIndex, activeAnimation.playOrder.length - 1);
    const framePosition = activeAnimation.playOrder[sequencePosition] ?? activeAnimation.playOrder[activeAnimation.playOrder.length - 1] ?? 0;

    return activeAnimation.frames[framePosition];
  }, [activeAnimation, frameIndex]);
  const isDarkMode = concreteThemeOptions.name === "dark";
  const applyHungerSnapshotLocally = useCallback((nextSnapshot: HungerSnapshot, now = Date.now()) => {
    hungerSnapshotRef.current = nextSnapshot;
    setCurrentTimeMs(now);
    setHungerSnapshot(nextSnapshot);
  }, []);

  const persistBabyBulbyState = useCallback(async (
    {
      clampAway = false,
      refetchAfter = false,
    }: {
      clampAway?: boolean,
      refetchAfter?: boolean,
    } = {},
    snapshotOverride?: HungerSnapshot | null,
  ): Promise<boolean> => {
    if (!currentUser?._id) {
      return false;
    }

    const baseSnapshot = snapshotOverride ?? hungerSnapshotRef.current;
    if (!baseSnapshot) {
      return false;
    }

    const now = Date.now();
    const normalizedSnapshot = normalizeHungerSnapshot(baseSnapshot, now, {
      clampAway,
      preserveUpdatedAt: false,
    });
    const localComparableKey = getDbStateComparableKey(baseSnapshot);
    const comparableKey = getDbStateComparableKey(normalizedSnapshot);

    setCurrentTimeMs(now);

    if (localComparableKey !== comparableKey) {
      applyHungerSnapshotLocally(normalizedSnapshot, now);
    }

    if (persistInFlightRef.current) {
      pendingPersistOptionsRef.current = pendingPersistOptionsRef.current
        ? {
          clampAway: pendingPersistOptionsRef.current.clampAway || clampAway,
          refetchAfter: pendingPersistOptionsRef.current.refetchAfter || refetchAfter,
        }
        : { clampAway, refetchAfter };
      return false;
    }

    if (!refetchAfter && lastPersistedStateKeyRef.current === comparableKey) {
      return true;
    }

    persistInFlightRef.current = true;

    try {
      await updateCurrentUser({
        babyBulbyState: snapshotToDbState(normalizedSnapshot),
      } as UpdateUserDataInput & { babyBulbyState: BabyBulbyDbState });
      lastPersistedStateKeyRef.current = comparableKey;

      if (refetchAfter) {
        await refetchCurrentUser();
      }

      return true;
    } catch {
      return false;
    } finally {
      persistInFlightRef.current = false;

      if (pendingPersistOptionsRef.current) {
        const nextPersistOptions = pendingPersistOptionsRef.current;
        pendingPersistOptionsRef.current = null;
        void persistBabyBulbyState(nextPersistOptions);
      }
    }
  }, [applyHungerSnapshotLocally, currentUser?._id, refetchCurrentUser, updateCurrentUser]);

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

  useEffect(() => {
    hungerSnapshotRef.current = hungerSnapshot;
  }, [hungerSnapshot]);

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
    if (!isEAForum || !isAdminViewer) {
      return;
    }

    if (loadedStorageKey === storageKey && position && hungerSnapshotRef.current) {
      return;
    }

    const now = Date.now();
    setCurrentTimeMs(now);
    const storage = getBrowserLocalStorage();
    const fallbackPosition = getDefaultPosition();

    // Pre-release cleanup: Bulby position remains browser-local, but hunger is DB-only.
    // We intentionally do not read any legacy local hunger here. If the logged-in admin
    // has no DB state yet, we start from the default snapshot and bootstrap it once below
    // so cross-device state becomes canonical immediately.
    bootstrapRequestedRef.current = false;
    lastPersistedStateKeyRef.current = serverBabyBulbyState
      ? getDbStateComparableKey(serverBabyBulbyState)
      : null;

    if (!storage) {
      setPosition(fallbackPosition);
      setLoadedStorageKey(storageKey);
      const nextSnapshot = serverBabyBulbyState
        ? createSnapshotFromDbState(serverBabyBulbyState, now)
        : createHungerSnapshot(HUNGER_DEFAULT, now, null, now);
      hungerSnapshotRef.current = nextSnapshot;
      setHungerSnapshot(nextSnapshot);
      return;
    }

    try {
      const rawCurrentValue = storage.getItem(storageKey);
      const parsedCurrentValue = rawCurrentValue ? JSON.parse(rawCurrentValue) : null;
      const storedPosition = isValidPosition(parsedCurrentValue) ? parsedCurrentValue : null;

      setPosition(storedPosition ? clampPosition(storedPosition) : fallbackPosition);
      if (serverBabyBulbyState) {
        const nextSnapshot = createSnapshotFromDbState(serverBabyBulbyState, now);
        hungerSnapshotRef.current = nextSnapshot;
        setHungerSnapshot(nextSnapshot);
      } else {
        const nextSnapshot = createHungerSnapshot(HUNGER_DEFAULT, now, null, now);
        hungerSnapshotRef.current = nextSnapshot;
        setHungerSnapshot(nextSnapshot);
      }
      setLoadedStorageKey(storageKey);
    } catch {
      setPosition(fallbackPosition);
      const nextSnapshot = serverBabyBulbyState
        ? createSnapshotFromDbState(serverBabyBulbyState, now)
        : createHungerSnapshot(HUNGER_DEFAULT, now, null, now);
      hungerSnapshotRef.current = nextSnapshot;
      setHungerSnapshot(nextSnapshot);
      setLoadedStorageKey(storageKey);
    }
  }, [clampPosition, currentUser?._id, getDefaultPosition, isAdminViewer, loadedStorageKey, position, serverBabyBulbyState, storageKey]);

  useEffect(() => {
    if (!isAdminViewer || displayStage !== "bulby" || loadedStorageKey !== storageKey) {
      return;
    }

    if (!serverBabyBulbyState) {
      return;
    }

    const now = Date.now();
    const nextSnapshot = createSnapshotFromDbState(serverBabyBulbyState, now);
    const currentSnapshot = hungerSnapshotRef.current;

    if (!currentSnapshot || nextSnapshot.updatedAt > currentSnapshot.updatedAt) {
      if (hungerMeterDeltaTimeoutRef.current !== null) {
        window.clearTimeout(hungerMeterDeltaTimeoutRef.current);
        hungerMeterDeltaTimeoutRef.current = null;
      }
      setHungerMeterDelta(null);
      previousFilledHungerSegmentsRef.current = getFilledHungerSegments(getDecayedHunger(nextSnapshot, now));
      applyHungerSnapshotLocally(nextSnapshot, now);
    }

    lastPersistedStateKeyRef.current = getDbStateComparableKey(nextSnapshot);
  }, [applyHungerSnapshotLocally, displayStage, isAdminViewer, loadedStorageKey, serverBabyBulbyState, storageKey]);

  useEffect(() => {
    if (!isAdminViewer || displayStage !== "bulby" || !isStateHydrated || serverBabyBulbyState || bootstrapRequestedRef.current || !currentUser?._id) {
      return;
    }

    const bootstrapSnapshot = hungerSnapshotRef.current;
    if (!bootstrapSnapshot) {
      return;
    }

    bootstrapRequestedRef.current = true;
    void persistBabyBulbyState({ refetchAfter: true }, bootstrapSnapshot).then((persisted) => {
      if (!persisted) {
        bootstrapRequestedRef.current = false;
      }
    });
  }, [currentUser?._id, displayStage, isAdminViewer, isStateHydrated, persistBabyBulbyState, serverBabyBulbyState]);

  useEffect(() => {
    if (!isAdminViewer || displayStage !== "bulby" || !isStateHydrated) {
      return;
    }

    let localClockInterval: number | null = null;

    const clearLocalClock = () => {
      if (localClockInterval !== null) {
        window.clearInterval(localClockInterval);
        localClockInterval = null;
      }
    };

    const isSiteActive = () => document.visibilityState === "visible" && document.hasFocus();

    const startLocalClock = () => {
      if (localClockInterval !== null) {
        return;
      }

      localClockInterval = window.setInterval(() => {
        setCurrentTimeMs(Date.now());
      }, HUNGER_LIVE_UPDATE_INTERVAL_MS);
    };

    const syncAwayState = () => {
      if (awaySyncCompletedRef.current) {
        return;
      }

      awaySyncCompletedRef.current = true;
      if (currentUser) {
        void persistBabyBulbyState({ clampAway: true });
      }
    };

    const refreshDecayMode = () => {
      const now = Date.now();
      setCurrentTimeMs(now);

      if (!isSiteActive()) {
        clearLocalClock();
        return;
      }

      awaySyncCompletedRef.current = false;
      startLocalClock();
    };

    const onPageHide = () => {
      clearLocalClock();
      syncAwayState();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearLocalClock();
        syncAwayState();
        return;
      }

      refreshDecayMode();
    };

    refreshDecayMode();
    window.addEventListener("focus", refreshDecayMode);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearLocalClock();
      window.removeEventListener("focus", refreshDecayMode);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [currentUser, displayStage, isAdminViewer, isStateHydrated, persistBabyBulbyState]);

  useEffect(() => {
    if (!isAdminViewer || displayStage !== "bulby") {
      return;
    }

    setCurrentTimeMs(Date.now());
  }, [pathname, displayStage, isAdminViewer]);

  useEffect(() => {
    if (!isAdminViewer || displayStage !== "bulby" || !isStateHydrated) {
      return;
    }

    const refetchBulbyState = () => {
      void refetchCurrentUser();
    };

    const refetchOnVisible = () => {
      if (document.visibilityState === "visible") {
        refetchBulbyState();
      }
    };

    window.addEventListener("focus", refetchBulbyState);
    document.addEventListener("visibilitychange", refetchOnVisible);

    return () => {
      window.removeEventListener("focus", refetchBulbyState);
      document.removeEventListener("visibilitychange", refetchOnVisible);
    };
  }, [displayStage, isAdminViewer, isStateHydrated, refetchCurrentUser]);

  useEffect(() => {
    if (!isAdminViewer || displayStage !== "bulby" || displayedHunger !== 0 || !hungerSnapshot || hungerSnapshot.hunger === 0) {
      return;
    }

    const nextSnapshot = createHungerSnapshot(0, currentTimeMs, null, currentTimeMs);
    applyHungerSnapshotLocally(nextSnapshot, currentTimeMs);
    if (currentUser) {
      void persistBabyBulbyState({}, nextSnapshot);
    }
  }, [applyHungerSnapshotLocally, currentTimeMs, currentUser, displayedHunger, hungerSnapshot, displayStage, isAdminViewer, persistBabyBulbyState]);

  useEffect(() => {
    if (!isAdminViewer || displayStage !== "bulby" || !isStateHydrated) {
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
  }, [filledHungerSegments, displayStage, isAdminViewer, isStateHydrated]);

  useEffect(() => () => {
    if (hungerMeterDeltaTimeoutRef.current !== null) {
      window.clearTimeout(hungerMeterDeltaTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isAdminViewer || displayStage !== "bulby") {
      return;
    }

    if (!isDead) {
      if (animationMode === "dead") {
        setAnimationMode("idle");
      }
      return;
    }

    if (animationMode === "dead") {
      return;
    }

    setAnimationMode("dead");
  }, [animationMode, isDead, displayStage, isAdminViewer]);

  useEffect(() => {
    if (!isAdminViewer) {
      return;
    }

    setFrameIndex(0);
  }, [activeAnimation, isAdminViewer]);

  useEffect(() => {
    if (!isAdminViewer) {
      return;
    }

    if (!activeAnimation.loop && !activeAnimation.nextMode) {
      setFrameIndex(Math.max(activeAnimation.playOrder.length - 1, 0));
      return;
    }

    if (!activeAnimation.loop) {
      let nextSequencePosition = 1;
      let timeout: number | undefined;

      const advanceAnimation = () => {
        if (nextSequencePosition < activeAnimation.playOrder.length) {
          setFrameIndex(nextSequencePosition);
          nextSequencePosition += 1;
          timeout = window.setTimeout(advanceAnimation, activeAnimation.frameDurationMs);
          return;
        }

        if (activeAnimation.nextMode) {
          setAnimationMode(activeAnimation.nextMode);
        }
      };

      timeout = window.setTimeout(advanceAnimation, activeAnimation.frameDurationMs);

      return () => {
        if (timeout !== undefined) {
          window.clearTimeout(timeout);
        }
      };
    }

    const interval = window.setInterval(() => {
      setFrameIndex((currentFrame) => (currentFrame + 1) % activeAnimation.playOrder.length);
    }, activeAnimation.frameDurationMs);

    return () => window.clearInterval(interval);
  }, [activeAnimation, isAdminViewer]);

  useEffect(() => {
    if (!isAdminViewer || displayStage !== "bulby") {
      setAnimationMode("idle");
      lastTriggeredPostPageRef.current = null;
      return;
    }

    if (!isStateHydrated) {
      return;
    }

    if (isDead) {
      lastTriggeredPostPageRef.current = postPageKey;
      return;
    }

    if (!postPageKey) {
      setAnimationMode("idle");
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
    if (!isCommunityPost) {
      const refill = getHungerRefill(currentPostReadTimeMinutes);
      const currentHunger = hungerSnapshotRef.current ? getDecayedHunger(hungerSnapshotRef.current, now) : HUNGER_DEFAULT;
      const nextSnapshot = createHungerSnapshot(
        getHungerAfterFeeding(currentHunger, refill),
        now,
        now + HUNGER_PAUSE_AFTER_EATING_MS,
        now,
      );
      applyHungerSnapshotLocally(nextSnapshot, now);
      if (currentUser) {
        void persistBabyBulbyState({}, nextSnapshot);
      }
    }
    setAnimationMode(isCommunityPost ? "refuse" : "eating");
  }, [applyHungerSnapshotLocally, currentPost, currentPostLoading, currentPostReadTimeMinutes, currentUser, displayStage, isAdminViewer, isCommunityPost, isDead, isStateHydrated, persistBabyBulbyState, postPageKey]);

  useEffect(() => {
    if (!isAdminViewer) {
      return;
    }

    if (!position || loadedStorageKey !== storageKey) {
      return;
    }

    const storage = getBrowserLocalStorage();
    if (!storage) {
      return;
    }

    try {
      storage.setItem(storageKey, JSON.stringify(position));
    } catch {
      // Ignore localStorage write failures so the overlay still works for the session.
    }
  }, [displayStage, isAdminViewer, loadedStorageKey, position, serverBabyBulbyState, storageKey]);

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

  /*
   * Full-release note: restore the logged-out egg click handler and signup prompt here.
   * The pre-launch admin-only build intentionally hides the egg experience entirely.
   */

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
    }
  }, []);

  // Admin-only soft-launch cheat: keep direct hunger editing available for testers.
  const setTestHungerFromSegment = useCallback((segmentIndex: number) => {
    if (displayStage !== "bulby") {
      return;
    }

    const now = Date.now();
    const nextSnapshot = createHungerSnapshot((segmentIndex + 1) * HUNGER_SEGMENT_VALUE, now, null, now);
    applyHungerSnapshotLocally(nextSnapshot, now);
    if (currentUser) {
      void persistBabyBulbyState({}, nextSnapshot);
    }
  }, [applyHungerSnapshotLocally, currentUser, displayStage, persistBabyBulbyState]);

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

  if (!isEAForum || !isAdminViewer) {
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
        aria-label="Your Baby Bulby"
      >
        <span className={classes.srOnly}>
          {/* Full-release note: restore egg-specific screenreader copy if the logged-out experience returns. */}
          {`Your Baby Bulby. Hunger ${displayedHunger ?? HUNGER_DEFAULT} out of ${HUNGER_MAX}.`}
        </span>
        <div className={classes.artFrame}>
          <SpriteGrid grid={currentSpriteGrid} isDarkMode={isDarkMode} />
        </div>
        {displayedHunger !== null && (
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
