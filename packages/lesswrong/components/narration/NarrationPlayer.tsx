"use client";
import React, { useMemo, useState } from "react";
import classNames from "classnames";
import moment from "moment";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { useLocalStorageState } from "@/components/hooks/useLocalStorageState";
import { useCookiesWithConsent } from "@/components/hooks/useCookiesWithConsent";
import { NARRATION_PLAYBACK_RATE_COOKIE } from "@/lib/cookies/cookies";
import ForumIcon from "@/components/common/ForumIcon";
import {
  DEFAULT_NARRATION_MODEL_ID,
  defaultNarrationVoiceTuning,
  type NarrationVoiceSettings,
} from "@/lib/narration/narrationTypes";
import { findNarrationComment } from "./narrationComments";
import { narrationHighlightStyles } from "./narrationHighlighting";
import { useNarrationPlayback, type NarrationItem } from "./useNarrationPlayback";
import NarrationSettingsPanel, { type NarrationModelOption, type NarrationVoiceOption } from "./NarrationSettingsPanel";

const NarrationOptionsQuery = gql(`
  query NarrationOptionsQuery {
    narrationOptions {
      voices {
        voiceId
        name
        category
        previewUrl
      }
      models {
        modelId
        name
      }
    }
  }
`);

const SKIP_BACK_MS = 15_000;
const SKIP_FORWARD_MS = 30_000;
const playbackRates = [0.75, 1, 1.25, 1.5, 1.75, 2];

const styles = defineStyles("NarrationPlayer", (theme: ThemeType) => ({
  root: {
    position: "fixed",
    left: "50%",
    bottom: 16,
    transform: "translateX(-50%)",
    width: 720,
    maxWidth: "calc(100vw - 24px)",
    zIndex: theme.zIndexes.narrationPlayer,
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.normal,
    borderRadius: theme.borderRadius.default,
    boxShadow: theme.palette.boxShadow.notificationsDrawer,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    color: theme.palette.text.normal,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
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
    padding: "4px 2px",
    fontFamily: "inherit",
    fontSize: "inherit",
    color: theme.palette.text.normal,
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  nowReading: {
    padding: "8px 16px 0",
    color: theme.palette.text.dim,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  status: {
    padding: "0 16px 8px",
    color: theme.palette.text.dim,
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

function parseStoredSettings(storedSettings: string|undefined): NarrationVoiceSettings|null {
  if (!storedSettings) {
    return null;
  }
  try {
    const { voiceId, modelId, stability, similarityBoost, style, speed }: Partial<NarrationVoiceSettings> = JSON.parse(storedSettings);
    const isComplete = typeof voiceId === "string"
      && typeof modelId === "string"
      && typeof stability === "number"
      && typeof similarityBoost === "number"
      && typeof style === "number"
      && typeof speed === "number";
    return isComplete ? { voiceId, modelId, stability, similarityBoost, style, speed } : null;
  } catch {
    return null;
  }
}

/** Says which comment is being read. Nothing is shown for the post, since that's what the player was opened for. */
function getNowReadingLabel(item: NarrationItem): string|null {
  if (item.type === "post") {
    return null;
  }
  const authorName = findNarrationComment(item.commentId)?.comment.user?.displayName;
  return authorName ? `Comment by ${authorName}` : "Comment";
}

/**
 * The settings to generate audio with: the ones this browser last used if
 * they're still available, and otherwise defaults. Null until the available
 * voices and models are known.
 */
function resolveSettings(
  storedSettings: NarrationVoiceSettings|null,
  voices: NarrationVoiceOption[]|undefined,
  models: NarrationModelOption[]|undefined,
): NarrationVoiceSettings|null {
  const defaultVoice = voices?.at(0);
  const defaultModel = models?.find(model => model.modelId === DEFAULT_NARRATION_MODEL_ID) ?? models?.at(0);
  if (!voices || !models || !defaultVoice || !defaultModel) {
    return null;
  }
  const storedSettingsAreAvailable = !!storedSettings
    && voices.some(voice => voice.voiceId === storedSettings.voiceId)
    && models.some(model => model.modelId === storedSettings.modelId);
  if (storedSettings && storedSettingsAreAvailable) {
    return storedSettings;
  }
  return { voiceId: defaultVoice.voiceId, modelId: defaultModel.modelId, ...defaultNarrationVoiceTuning };
}

const NarrationPlayer = ({ postId, onClose }: {
  postId: string
  onClose: () => void
}) => {
  const classes = useStyles(styles);
  useStyles(narrationHighlightStyles);

  const { data: optionsData, error: optionsError } = useQuery(NarrationOptionsQuery, { ssr: false });
  const voices = optionsData?.narrationOptions.voices;
  const models = optionsData?.narrationOptions.models;

  const { narrationVoiceSettings, setNarrationVoiceSettings } = useLocalStorageState("narrationVoiceSettings", key => key, "");
  const settings = useMemo(
    () => resolveSettings(parseStoredSettings(narrationVoiceSettings), voices, models),
    [narrationVoiceSettings, voices, models],
  );

  const [showSettings, setShowSettings] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [scrubPositionMs, setScrubPositionMs] = useState<number|null>(null);

  const [cookies, setCookie] = useCookiesWithConsent([NARRATION_PLAYBACK_RATE_COOKIE]);
  const storedPlaybackRate = Number(cookies[NARRATION_PLAYBACK_RATE_COOKIE]);
  const playbackRate = playbackRates.includes(storedPlaybackRate) ? storedPlaybackRate : 1;
  const setPlaybackRate = (newPlaybackRate: number) => {
    setCookie(NARRATION_PLAYBACK_RATE_COOKIE, String(newPlaybackRate), {
      path: "/",
      expires: moment().add(2, "years").toDate(),
    });
  };

  const playback = useNarrationPlayback({ postId, settings, autoScroll, playbackRate });
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
  const statusMessage = playback.statusMessage ?? (settings || optionsError ? null : "Loading voices…");

  return <div className={classes.root} role="region" aria-label="Post narration">
    <audio ref={playback.audioRef} preload="auto" {...playback.audioEventHandlers} />

    {showSettings && settings && voices && models && <NarrationSettingsPanel
      voices={voices}
      models={models}
      settings={settings}
      onApply={newSettings => setNarrationVoiceSettings(JSON.stringify(newSettings))}
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
        aria-label={isPlayingOrLoading ? "Pause" : "Play"}
        title={isPlayingOrLoading ? "Pause" : "Play"}
      >
        <ForumIcon icon={isPlayingOrLoading ? "Pause" : "Play"} />
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

      <select
        className={classes.rateSelect}
        value={playbackRate}
        onChange={event => setPlaybackRate(Number(event.target.value))}
        aria-label="Playback speed"
      >
        {playbackRates.map(rate => <option key={rate} value={rate}>{rate}×</option>)}
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

    {statusMessage && !errorMessage && <div className={classes.status} role="status">{statusMessage}</div>}
    {errorMessage && <div className={classes.error} role="alert">{errorMessage}</div>}
  </div>;
};

export default NarrationPlayer;
