"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { useStyles } from "@/components/hooks/useStyles";
import { useLocalStorageState } from "@/components/hooks/useLocalStorageState";
import { useIsAboveBreakpoint } from "@/components/hooks/useScreenWidth";
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
  NARRATION_PLAYER_FLOATING_BREAKPOINT,
  publishNarrationPlayerFootprint,
} from "./narrationPlayerLayout";
import { NARRATION_PLAYER_FLOATING_MARGIN, narrationPlayerStyles } from "./narrationPlayerStyles";
import { useNarrationPlayerTheme } from "./narrationPlayerThemes";
import { useNarrationPlayback, type NarrationItem } from "./useNarrationPlayback";
import { formatNarrationPlaybackRate, narrationPlaybackRates, useNarrationPlaybackRate } from "./useNarrationPlaybackRate";
import NarrationSettingsPanel, { type NarrationOptions } from "./NarrationSettingsPanel";
import NarrationSkipIcon from "./NarrationSkipIcon";

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

function formatTime(timeMs: number): string {
  const totalSeconds = Math.floor(timeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

/**
 * How much of the scrubber's rail to fill, as a CSS length: up to the middle
 * of the thumb, which goes from half its width inside one end of the rail to
 * half its width inside the other.
 */
function getScrubberFillWidth(positionMs: number, durationMs: number|null): string {
  if (!durationMs) {
    return "0%";
  }
  const fraction = Math.min(positionMs / durationMs, 1);
  return `calc(var(--narration-thumb-width) / 2 + ${fraction} * (100% - var(--narration-thumb-width)))`;
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
  const classes = useStyles(narrationPlayerStyles);
  useStyles(narrationHighlightStyles);
  const theme = useNarrationPlayerTheme();

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
      topEdge: root.offsetHeight + (isFloating ? NARRATION_PLAYER_FLOATING_MARGIN : 0),
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

  return <div ref={rootRef} className={classNames(classes.root, classes[theme])} role="region" aria-label="Post narration">
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
      <div className={classes.transport}>
        <button
          type="button"
          className={classNames(classes.iconButton, classes.skipButton, classes.skipBack)}
          onClick={() => playback.skip(-SKIP_BACK_MS)}
          disabled={durationMs === null}
          aria-label="Back 15 seconds"
          title="Back 15 seconds"
        >
          <NarrationSkipIcon direction="back" seconds={SKIP_BACK_MS / 1000} />
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
            ? <Loading className={classes.playButtonSpinner} />
            : <ForumIcon icon={playButtonLabel} className={classNames({ [classes.playIcon]: !isPlayingOrLoading })} />
          }
        </button>
        <button
          type="button"
          className={classNames(classes.iconButton, classes.skipButton, classes.skipForward)}
          onClick={() => playback.skip(SKIP_FORWARD_MS)}
          disabled={durationMs === null}
          aria-label="Forward 30 seconds"
          title="Forward 30 seconds"
        >
          <NarrationSkipIcon direction="forward" seconds={SKIP_FORWARD_MS / 1000} />
        </button>
      </div>

      <div className={classes.timeline}>
        <span className={classNames(classes.time, classes.elapsed)}>{formatTime(shownPositionMs)}</span>
        <div className={classes.scrubber}>
          <div className={classes.scrubberRail}>
            <div className={classes.scrubberFill} style={{ width: getScrubberFillWidth(shownPositionMs, durationMs) }} />
          </div>
          <input
            className={classes.scrubberInput}
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
        </div>
        <span className={classNames(classes.time, classes.duration)}>{durationLabel}</span>
      </div>

      <select
        className={classes.rateSelect}
        value={playbackRate}
        onChange={event => setPlaybackRate(Number(event.target.value))}
        aria-label="Playback speed"
      >
        {narrationPlaybackRates.map(rate => <option key={rate} value={rate}>{formatNarrationPlaybackRate(rate)}</option>)}
      </select>
      <div className={classes.tools}>
        <button
          type="button"
          className={classes.iconButton}
          onClick={() => setShowSettings(!showSettings)}
          disabled={!settings}
          aria-label="Voice settings"
          aria-expanded={showSettings}
          title="Voice settings"
        >
          <ForumIcon icon="Sliders" />
        </button>
        <button type="button" className={classes.iconButton} onClick={onClose} aria-label="Close narration" title="Close">
          <ForumIcon icon="Close" />
        </button>
      </div>
    </div>

    <div className={classes.status} role="status">{statusMessage}</div>
    {errorMessage && <div className={classes.error} role="alert">{errorMessage}</div>}
  </div>;
};

export default NarrationPlayer;
