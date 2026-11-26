"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { useLocalStorageState } from "@/components/hooks/useLocalStorageState";
import { useIsAboveBreakpoint } from "@/components/hooks/useScreenWidth";
import { LLM_CHAT_SIDEBAR_WIDTH } from "@/components/languageModels/llmChatSidebarWidth";
import { POSTS_BOTTOM_BAR_SHOWN_PROPERTY } from "@/components/posts/PostsBottomBar";
import { RIGHT_COLUMN_WIDTH_WITH_SIDENOTES } from "@/components/posts/PostsPage/constants";
import ForumIcon from "@/components/common/ForumIcon";
import Loading from "@/components/vulcan-core/Loading";
import {
  AUTHOR_NARRATION_VOICE,
  DEFAULT_NARRATION_MODEL_ID,
  type NarrationListenerSettings,
} from "@/lib/narration/narrationTypes";
import { findNarrationComment } from "./narrationComments";
import { narrationHighlightStyles } from "./narrationHighlighting";
import {
  clearNarrationPlayerFootprint,
  NARRATION_PLAYER_DOCKED_CLASS,
  NARRATION_PLAYER_FLOATING_BREAKPOINT,
  narrationDockHeight,
  narrationPlayerHasRoom,
  publishNarrationPlayerFootprint,
} from "./narrationPlayerLayout";
import { useNarrationPlayback, type NarrationItem } from "./useNarrationPlayback";
import { formatNarrationPlaybackRate, narrationPlaybackRates, useNarrationPlaybackRate } from "./useNarrationPlaybackRate";
import NarrationSettingsPanel, { type NarrationOptions } from "./NarrationSettingsPanel";

const NarrationOptionsQuery = gql(`
  query NarrationOptionsQuery {
    narrationOptions {
      voices {
        voiceId
        name
        description
        previewUrl
      }
      adminOptions {
        voices {
          voiceId
          name
          description
          previewUrl
        }
        models {
          modelId
          name
        }
      }
    }
  }
`);

const SKIP_BACK_MS = 15_000;
const SKIP_FORWARD_MS = 30_000;

const FLOATING_MARGIN = 12;
/** Post pages have a right-hand margin at least this wide at the widths where the player floats, which it fits inside */
const FLOATING_WIDTH = RIGHT_COLUMN_WIDTH_WITH_SIDENOTES - (2 * FLOATING_MARGIN);

const styles = defineStyles("NarrationPlayer", (theme: ThemeType) => ({
  "@global": {
    // So that the end of the page can be scrolled clear of the docked player
    [`body.${NARRATION_PLAYER_DOCKED_CLASS}`]: {
      paddingBottom: narrationDockHeight,
    },
  },
  root: {
    position: "fixed",
    zIndex: theme.zIndexes.narrationPlayer,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    color: theme.palette.text.normal,

    [theme.breakpoints.up(NARRATION_PLAYER_FLOATING_BREAKPOINT)]: {
      right: FLOATING_MARGIN,
      bottom: FLOATING_MARGIN,
      width: FLOATING_WIDTH,
      background: theme.palette.panelBackground.default,
      border: theme.palette.border.normal,
      borderRadius: theme.borderRadius.default,
      boxShadow: theme.palette.boxShadow.notificationsDrawer,
      // The LLM chat sidebar takes the right-hand side of the screen for
      // itself, so the corner that's free is the one next to it
      "body:has(.SidebarLanguageModelChat-root) &": {
        right: LLM_CHAT_SIDEBAR_WIDTH + FLOATING_MARGIN,
      },
    },

    // Docked across the bottom of the screen, looking like the bottom bar
    // that post pages have on phones (PostsBottomBar). On phones it sits on
    // top of that bar, as part of the same panel: when the bar slides away,
    // the player moves down into its place.
    [theme.breakpoints.down("md")]: {
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.palette.background.pageActiveAreaBackground,
      boxShadow: `0 -2px 8px ${theme.palette.greyAlpha(0.1)}`,
      transform: `translateY(calc(-1 * var(${POSTS_BOTTOM_BAR_SHOWN_PROPERTY}, 0) * var(--header-height)))`,
      transition: "transform 200ms ease-in-out",
    },
  },
  // The timeline has a row to itself, above the buttons, unless there's room
  // for it between them.
  controls: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 6,
    rowGap: 2,
    padding: "8px 12px",
  },
  timeline: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    order: -1,
    flex: "1 1 100%",
    minWidth: 0,
    [narrationPlayerHasRoom(theme)]: {
      order: 0,
      flex: "1 1 0",
    },
  },
  iconButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: 32,
    height: 32,
    padding: 0,
    color: theme.palette.icon.dim,
    background: "transparent",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    "&:hover:not(:disabled)": {
      background: theme.palette.greyAlpha(0.08),
    },
    "&:disabled": {
      opacity: 0.4,
      cursor: "default",
    },
    "& svg": {
      width: 20,
      height: 20,
    },
  },
  playButton: {
    color: theme.palette.text.alwaysWhite,
    background: theme.palette.primary.main,
    "&:hover:not(:disabled)": {
      background: theme.palette.primary.dark,
    },
  },
  // The circle that the three tips of the play icon's triangle lie on is
  // centred 1.6 units left of the middle of the icon's 24-unit viewBox. This
  // moves it onto the middle of the button, so that the tips are all the same
  // distance from the button's edge.
  playIcon: {
    transform: "translateX(6.67%)",
  },
  time: {
    flexShrink: 0,
    minWidth: 44,
    textAlign: "center",
    fontVariantNumeric: "tabular-nums",
    color: theme.palette.text.dim,
  },
  scrubber: {
    flexGrow: 1,
    minWidth: 60,
  },
  rateSelect: {
    flexShrink: 0,
    marginLeft: "auto",
    padding: "4px 2px",
    fontFamily: "inherit",
    fontSize: "inherit",
    color: theme.palette.text.normal,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    [narrationPlayerHasRoom(theme)]: {
      marginLeft: 0,
    },
  },
  nowReading: {
    padding: "8px 16px 0",
    color: theme.palette.text.dim,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  // Takes the place of the play button's icon while there's something to
  // wait for. The site's loading indicator is wider than the button, so it's
  // scaled down to fit.
  playButtonSpinner: {
    flexShrink: 0,
    transform: "scale(0.6)",
  },
  // Says what the spinner is for, to screen readers
  status: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  },
  error: {
    padding: "0 16px 8px",
    color: theme.palette.text.error2,
    overflowWrap: "anywhere",
  },
}));

function formatTime(timeMs: number): string {
  const totalSeconds = Math.floor(timeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

function parseStoredSettings(storedSettings: string|undefined): NarrationListenerSettings|null {
  if (!storedSettings) {
    return null;
  }
  try {
    const { postVoiceId, commentVoiceId, modelId }: Partial<NarrationListenerSettings> = JSON.parse(storedSettings);
    const isComplete = typeof postVoiceId === "string" && typeof commentVoiceId === "string" && typeof modelId === "string";
    return isComplete ? { postVoiceId, commentVoiceId, modelId } : null;
  } catch {
    return null;
  }
}

/** Says which comment is being read. Nothing is shown for the post, since that's what the player was opened for. */
function getNowReadingLabel(item: NarrationItem): string|null {
  if (item.type === "post") {
    return null;
  }
  const comment = findNarrationComment(item.commentId)?.comment;
  const kindOfComment = comment?.answer ? "Answer" : "Comment";
  const authorName = comment?.user?.displayName;
  return authorName ? `${kindOfComment} by ${authorName}` : kindOfComment;
}

function keepIfOffered(storedValue: string|undefined, choices: ReadonlySet<string>, defaultValue: string): string {
  return storedValue !== undefined && choices.has(storedValue) ? storedValue : defaultValue;
}

/**
 * What to read things in: for each setting, what this browser last used if
 * that's still one of the choices, and otherwise the default. Posts are read
 * in the first of the voices unless another is chosen, and comments in their
 * authors' voices. Null until the choices are known.
 */
function resolveSettings(storedSettings: NarrationListenerSettings|null, options: NarrationOptions|undefined): NarrationListenerSettings|null {
  const defaultPostVoice = options?.voices.at(0);
  if (!options || !defaultPostVoice) {
    return null;
  }
  const voiceIds = [...options.voices, ...(options.adminOptions?.voices ?? [])].map(voice => voice.voiceId);
  const voiceChoices = new Set([...voiceIds, AUTHOR_NARRATION_VOICE]);
  const modelIds = new Set(options.adminOptions?.models.map(model => model.modelId));
  return {
    postVoiceId: keepIfOffered(storedSettings?.postVoiceId, voiceChoices, defaultPostVoice.voiceId),
    commentVoiceId: keepIfOffered(storedSettings?.commentVoiceId, voiceChoices, AUTHOR_NARRATION_VOICE),
    modelId: keepIfOffered(storedSettings?.modelId, modelIds, DEFAULT_NARRATION_MODEL_ID),
  };
}

const NarrationPlayer = ({ postId, postHasBody, onClose }: {
  postId: string
  /** Whether the post has any text of its own. A shortform container usually doesn't, and then narration is of its comments only. */
  postHasBody: boolean
  onClose: () => void
}) => {
  const classes = useStyles(styles);
  useStyles(narrationHighlightStyles);

  const { data: optionsData, error: optionsError } = useQuery(NarrationOptionsQuery, { ssr: false });
  const options = optionsData?.narrationOptions;

  const { narrationVoiceSettings, setNarrationVoiceSettings } = useLocalStorageState("narrationVoiceSettings", key => key, "");
  const settings = useMemo(
    () => resolveSettings(parseStoredSettings(narrationVoiceSettings), options),
    [narrationVoiceSettings, options],
  );

  const rootRef = useRef<HTMLDivElement|null>(null);
  const isFloating = useIsAboveBreakpoint(NARRATION_PLAYER_FLOATING_BREAKPOINT);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const publishFootprint = () => publishNarrationPlayerFootprint({
      isFloating,
      topEdge: root.offsetHeight + (isFloating ? FLOATING_MARGIN : 0),
    });
    publishFootprint();
    const resizeObserver = new ResizeObserver(publishFootprint);
    resizeObserver.observe(root);
    return () => {
      resizeObserver.disconnect();
      clearNarrationPlayerFootprint();
    };
  }, [isFloating]);

  const [showSettings, setShowSettings] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [scrubPositionMs, setScrubPositionMs] = useState<number|null>(null);

  const { playbackRate, setPlaybackRate } = useNarrationPlaybackRate();

  const playback = useNarrationPlayback({ postId, postHasBody, settings, autoScroll, playbackRate });
  const { phase, positionMs, durationMs } = playback;
  const nowReadingLabel = getNowReadingLabel(playback.currentItem);
  const isPlayingOrLoading = phase === "playing" || phase === "loading";

  const commitScrub = () => {
    if (scrubPositionMs !== null) {
      playback.seekTo(scrubPositionMs);
      setScrubPositionMs(null);
    }
  };

  const shownPositionMs = scrubPositionMs ?? Math.min(positionMs, durationMs ?? positionMs);
  const durationLabel = durationMs === null
    ? "--:--"
    : `${playback.durationIsEstimated ? "~" : ""}${formatTime(durationMs)}`;
  const errorMessage = playback.errorMessage ?? optionsError?.message ?? null;
  const waitingFor = playback.statusMessage ?? (settings || optionsError ? null : "Loading voices…");
  const statusMessage = errorMessage ? null : waitingFor;
  const playButtonLabel = isPlayingOrLoading ? "Pause" : "Play";

  return <div ref={rootRef} className={classes.root} role="region" aria-label="Post narration">
    <audio ref={playback.audioRef} preload="auto" {...playback.audioEventHandlers} />

    {showSettings && settings && options && <NarrationSettingsPanel
      options={options}
      settings={settings}
      onApply={newSettings => setNarrationVoiceSettings(JSON.stringify(newSettings))}
      onClose={() => setShowSettings(false)}
      autoScroll={autoScroll}
      setAutoScroll={setAutoScroll}
    />}

    {nowReadingLabel && <div className={classes.nowReading}>{nowReadingLabel}</div>}
    <div className={classes.controls}>
      <button
        type="button"
        className={classes.iconButton}
        onClick={() => playback.skip(-SKIP_BACK_MS)}
        disabled={durationMs === null}
        aria-label="Back 15 seconds"
        title="Back 15 seconds"
      >
        <ForumIcon icon="Backward" />
      </button>
      <button
        type="button"
        className={classNames(classes.iconButton, classes.playButton)}
        onClick={isPlayingOrLoading ? playback.pause : playback.play}
        disabled={!settings}
        aria-label={playButtonLabel}
        aria-busy={!!statusMessage}
        title={statusMessage ?? playButtonLabel}
      >
        {statusMessage
          ? <Loading white className={classes.playButtonSpinner} />
          : <ForumIcon icon={playButtonLabel} className={classNames({ [classes.playIcon]: !isPlayingOrLoading })} />
        }
      </button>
      <button
        type="button"
        className={classes.iconButton}
        onClick={() => playback.skip(SKIP_FORWARD_MS)}
        disabled={durationMs === null}
        aria-label="Forward 30 seconds"
        title="Forward 30 seconds"
      >
        <ForumIcon icon="Forward" />
      </button>

      <div className={classes.timeline}>
        <span className={classes.time}>{formatTime(shownPositionMs)}</span>
        <input
          className={classes.scrubber}
          type="range"
          min={0}
          max={durationMs ?? 0}
          value={shownPositionMs}
          onChange={event => setScrubPositionMs(Number(event.target.value))}
          onPointerUp={commitScrub}
          onKeyUp={commitScrub}
          onBlur={commitScrub}
          disabled={durationMs === null}
          aria-label="Position in narration"
          aria-valuetext={`${formatTime(shownPositionMs)} of ${durationLabel}`}
        />
        <span className={classes.time}>{durationLabel}</span>
      </div>

      <select
        className={classes.rateSelect}
        value={playbackRate}
        onChange={event => setPlaybackRate(Number(event.target.value))}
        aria-label="Playback speed"
      >
        {narrationPlaybackRates.map(rate => <option key={rate} value={rate}>{formatNarrationPlaybackRate(rate)}</option>)}
      </select>
      <button
        type="button"
        className={classes.iconButton}
        onClick={() => setShowSettings(!showSettings)}
        disabled={!settings}
        aria-label="Voice settings"
        aria-expanded={showSettings}
        title="Voice settings"
      >
        <ForumIcon icon="Settings" />
      </button>
      <button type="button" className={classes.iconButton} onClick={onClose} aria-label="Close narration" title="Close">
        <ForumIcon icon="Close" />
      </button>
    </div>

    <div className={classes.status} role="status">{statusMessage}</div>
    {errorMessage && <div className={classes.error} role="alert">{errorMessage}</div>}
  </div>;
};

export default NarrationPlayer;
