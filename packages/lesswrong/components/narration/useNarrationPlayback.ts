import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import sum from "lodash/sum";
import { gql } from "@/lib/generated/gql-codegen";
import type { NarrationScript, NarrationSegmentTimings, NarrationVoiceSettings } from "@/lib/narration/narrationTypes";
import {
  clearNarrationHighlight,
  createNarrationHighlighter,
  findBlockTimingAt,
  findScriptBlockIndexForNode,
  scrollToNarrationBlock,
  updateNarrationHighlight,
  type NarrationHighlighter,
} from "./narrationHighlighting";

const PrepareNarrationMutation = gql(`
  mutation PrepareNarrationMutation($postId: String!) {
    prepareNarration(postId: $postId) {
      ...NarrationScriptFragment
    }
  }
`);

const GenerateNarrationSegmentAudioMutation = gql(`
  mutation GenerateNarrationSegmentAudioMutation($narrationSegmentId: String!, $settings: NarrationVoiceSettingsInput!) {
    generateNarrationSegmentAudio(narrationSegmentId: $narrationSegmentId, settings: $settings) {
      ...NarrationSegmentAudioFragment
    }
  }
`);

const NarrationSegmentAudiosQuery = gql(`
  query NarrationSegmentAudiosQuery($narrationScriptId: String!, $settings: NarrationVoiceSettingsInput!) {
    narrationSegmentAudios(narrationScriptId: $narrationScriptId, settings: $settings) {
      ...NarrationSegmentAudioFragment
    }
  }
`);

/** Used to place segments on the timeline before any audio has been generated to measure */
const DEFAULT_MS_PER_CHARACTER = 65;
/** After the reader scrolls, how long before the page is scrolled to follow the narration again */
const USER_SCROLL_GRACE_MS = 5000;
const POST_CONTENT_ELEMENT_ID = "postContent";
const scrollKeys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

export type NarrationPhase = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

type NarrationSegmentInfo = NarrationScriptFragment["segments"][number];

interface PreparedNarration {
  narrationScriptId: string
  segments: NarrationSegmentInfo[]
  script: NarrationScript
}

interface LoadedSegmentAudio {
  audioUrl: string
  durationMs: number
  timings: NarrationSegmentTimings
}

/** Where to start playing from: partway through a segment, or at the start of a block of the script */
type PlaybackTarget =
  | { type: "fraction", segmentIndex: number, fraction: number }
  | { type: "block", blockIndex: number };

interface EngineState {
  prepared: Promise<PreparedNarration>|null
  /** Keyed by settings and segment; see getSegmentAudioKey */
  segmentAudios: Map<string, Promise<LoadedSegmentAudio>>
  /** What the audio element currently holds */
  loadedSegment: { segmentIndex: number, settingsKey: string, audio: LoadedSegmentAudio }|null
  /** Incremented whenever playback is redirected, so that work started for an earlier request can tell it's been superseded */
  commandToken: number
  /** Where playback was last asked to start from, until the audio for it has been loaded */
  pendingTarget: PlaybackTarget|null
  highlighter: NarrationHighlighter|null
  lastUserScrollAt: number
}

export interface NarrationPlayback {
  audioRef: RefObject<HTMLAudioElement|null>
  audioEventHandlers: {
    onPlaying: () => void
    onPause: () => void
    onEnded: () => void
    onTimeUpdate: () => void
    onSeeked: () => void
    onError: () => void
  }
  phase: NarrationPhase
  statusMessage: string|null
  errorMessage: string|null
  positionMs: number
  /** Null until the narration's script has been loaded */
  durationMs: number|null
  durationIsEstimated: boolean
  playbackRate: number
  play: () => void
  pause: () => void
  seekTo: (timelineMs: number) => void
  skip: (deltaMs: number) => void
  setPlaybackRate: (playbackRate: number) => void
}

function getSettingsKey(settings: NarrationVoiceSettings): string {
  return JSON.stringify([settings.voiceId, settings.modelId, settings.stability, settings.similarityBoost, settings.style, settings.speed]);
}

function getSegmentAudioKey(settingsKey: string, segmentId: string): string {
  return `${settingsKey}:${segmentId}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetching ${url} failed with status ${response.status}`);
  }
  const result: T = await response.json();
  return result;
}

/**
 * How long each segment is. Segments whose audio hasn't been generated are
 * estimated from their length, at the speaking rate of the ones that have.
 */
function getSegmentDurations(segments: NarrationSegmentInfo[], settingsKey: string, knownDurations: Record<string, number>): number[] {
  const measuredSegments = segments.filter(segment => getSegmentAudioKey(settingsKey, segment._id) in knownDurations);
  const measuredMs = sum(measuredSegments.map(segment => knownDurations[getSegmentAudioKey(settingsKey, segment._id)]));
  const measuredCharacters = sum(measuredSegments.map(segment => segment.characterCount));
  const msPerCharacter = measuredCharacters > 0 ? measuredMs / measuredCharacters : DEFAULT_MS_PER_CHARACTER;
  return segments.map(segment =>
    knownDurations[getSegmentAudioKey(settingsKey, segment._id)] ?? (segment.characterCount * msPerCharacter)
  );
}

function locateOnTimeline(segmentDurations: number[], timelineMs: number): { segmentIndex: number, fraction: number } {
  const segmentStarts = segmentDurations.map((_, i) => sum(segmentDurations.slice(0, i)));
  const segmentIndex = Math.max(0, segmentStarts.findLastIndex(start => start <= timelineMs));
  const fraction = (timelineMs - segmentStarts[segmentIndex]) / segmentDurations[segmentIndex];
  return { segmentIndex, fraction: Math.min(Math.max(fraction, 0), 1) };
}

function isPlaybackBlockedError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}

/**
 * Plays a post's narration, segment by segment, through a single audio
 * element. Audio for a segment is requested (and generated, if nobody has
 * listened to it with these settings before) when playback reaches it, and
 * the segment after the one being played is requested ahead of time.
 */
export function useNarrationPlayback({ postId, settings, autoScroll }: {
  postId: string
  /** Null until the settings to use are known; playback can't start before then */
  settings: NarrationVoiceSettings|null
  autoScroll: boolean
}): NarrationPlayback {
  const apolloClient = useApolloClient();
  const [prepareNarration] = useMutation(PrepareNarrationMutation);
  const [generateSegmentAudio] = useMutation(GenerateNarrationSegmentAudioMutation);

  const audioRef = useRef<HTMLAudioElement|null>(null);
  const engineRef = useRef<EngineState>({
    prepared: null,
    segmentAudios: new Map(),
    loadedSegment: null,
    commandToken: 0,
    pendingTarget: null,
    highlighter: null,
    lastUserScrollAt: 0,
  });

  const [phase, setPhase] = useState<NarrationPhase>("idle");
  const [statusMessage, setStatusMessage] = useState<string|null>(null);
  const [errorMessage, setErrorMessage] = useState<string|null>(null);
  const [prepared, setPrepared] = useState<PreparedNarration|null>(null);
  /** How long each segment's audio is, for those that have been generated. Keyed like EngineState.segmentAudios. */
  const [knownDurations, setKnownDurations] = useState<Record<string, number>>({});
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [segmentTimeMs, setSegmentTimeMs] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);

  const settingsKey = settings ? getSettingsKey(settings) : null;

  const segmentDurations = useMemo(
    () => (prepared && settingsKey) ? getSegmentDurations(prepared.segments, settingsKey, knownDurations) : null,
    [prepared, settingsKey, knownDurations],
  );
  const durationIsEstimated = !!prepared && !!settingsKey && prepared.segments.some(
    segment => !(getSegmentAudioKey(settingsKey, segment._id) in knownDurations)
  );

  const positionMs = segmentDurations ? sum(segmentDurations.slice(0, currentSegmentIndex)) + segmentTimeMs : 0;
  const durationMs = segmentDurations ? sum(segmentDurations) : null;

  const latestRef = useRef({ settings, settingsKey, segmentDurations, positionMs, playbackRate, autoScroll, phase });
  latestRef.current = { settings, settingsKey, segmentDurations, positionMs, playbackRate, autoScroll, phase };

  const ensurePrepared = useCallback((): Promise<PreparedNarration> => {
    const engine = engineRef.current;
    if (engine.prepared) {
      return engine.prepared;
    }
    const preparing = (async () => {
      const { data } = await prepareNarration({ variables: { postId } });
      const narrationScript = data?.prepareNarration;
      if (!narrationScript) {
        throw new Error("Preparing the narration returned nothing");
      }
      const script = await fetchJson<NarrationScript>(narrationScript.scriptUrl);
      const result = { narrationScriptId: narrationScript._id, segments: narrationScript.segments, script };
      setPrepared(result);
      return result;
    })();
    engine.prepared = preparing;
    preparing.catch(() => {
      if (engine.prepared === preparing) {
        engine.prepared = null;
      }
    });
    return preparing;
  }, [prepareNarration, postId]);

  const loadSegmentAudio = useCallback((segment: NarrationSegmentInfo, voiceSettings: NarrationVoiceSettings): Promise<LoadedSegmentAudio> => {
    const engine = engineRef.current;
    const audioKey = getSegmentAudioKey(getSettingsKey(voiceSettings), segment._id);
    const alreadyLoading = engine.segmentAudios.get(audioKey);
    if (alreadyLoading) {
      return alreadyLoading;
    }
    const loading = (async () => {
      const { data } = await generateSegmentAudio({ variables: { narrationSegmentId: segment._id, settings: voiceSettings } });
      const audio = data?.generateNarrationSegmentAudio;
      if (!audio) {
        throw new Error("Generating audio returned nothing");
      }
      const timings = await fetchJson<NarrationSegmentTimings>(audio.timingsUrl);
      setKnownDurations(durations => ({ ...durations, [audioKey]: audio.durationMs }));
      return { audioUrl: audio.audioUrl, durationMs: audio.durationMs, timings };
    })();
    engine.segmentAudios.set(audioKey, loading);
    loading.catch(() => {
      if (engine.segmentAudios.get(audioKey) === loading) {
        engine.segmentAudios.delete(audioKey);
      }
    });
    return loading;
  }, [generateSegmentAudio]);

  const playFrom = useCallback(async (target: PlaybackTarget) => {
    const engine = engineRef.current;
    const audioElement = audioRef.current;
    const voiceSettings = latestRef.current.settings;
    if (!audioElement || !voiceSettings) {
      return;
    }
    const commandToken = ++engine.commandToken;
    engine.pendingTarget = target;
    audioElement.pause();
    setPhase("loading");
    setErrorMessage(null);

    try {
      setStatusMessage("Preparing narration…");
      const preparedNarration = await ensurePrepared();
      if (commandToken !== engine.commandToken) {
        return;
      }
      const segmentIndex = target.type === "block"
        ? preparedNarration.segments.findIndex(segment => segment.startBlockIndex <= target.blockIndex && target.blockIndex < segment.endBlockIndex)
        : target.segmentIndex;
      const segment = preparedNarration.segments.at(segmentIndex);
      if (segmentIndex < 0 || !segment) {
        throw new Error("That part of the post isn't in the narration");
      }

      setStatusMessage("Generating audio…");
      const segmentAudio = await loadSegmentAudio(segment, voiceSettings);
      if (commandToken !== engine.commandToken) {
        return;
      }
      const offsetMs = target.type === "block"
        ? segmentAudio.timings.blocks.find(block => block.blockIndex === target.blockIndex)?.startMs ?? 0
        : target.fraction * segmentAudio.durationMs;

      if (engine.loadedSegment?.audio.audioUrl !== segmentAudio.audioUrl) {
        audioElement.src = segmentAudio.audioUrl;
      }
      engine.loadedSegment = { segmentIndex, settingsKey: getSettingsKey(voiceSettings), audio: segmentAudio };
      engine.pendingTarget = null;
      audioElement.currentTime = offsetMs / 1000;
      audioElement.defaultPlaybackRate = latestRef.current.playbackRate;
      audioElement.playbackRate = latestRef.current.playbackRate;
      setCurrentSegmentIndex(segmentIndex);
      setSegmentTimeMs(offsetMs);
      setStatusMessage(null);

      const nextSegment = preparedNarration.segments.at(segmentIndex + 1);
      if (nextSegment) {
        // A failure here will come up again, and be reported, when playback reaches that segment
        void loadSegmentAudio(nextSegment, voiceSettings).catch(() => {});
      }
      await audioElement.play();
    } catch (error) {
      if (commandToken !== engine.commandToken) {
        return;
      }
      setStatusMessage(null);
      if (isPlaybackBlockedError(error)) {
        // The browser wouldn't start playback without a click; the audio is
        // loaded, so pressing play again will work.
        setPhase("paused");
        return;
      }
      setPhase("error");
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  }, [ensurePrepared, loadSegmentAudio]);

  const updateHighlight = useCallback(() => {
    const engine = engineRef.current;
    const audioElement = audioRef.current;
    if (!engine.highlighter || !engine.loadedSegment || !audioElement) {
      return;
    }
    const changedBlockRect = updateNarrationHighlight(
      engine.highlighter,
      engine.loadedSegment.audio.timings,
      audioElement.currentTime * 1000,
    );
    const readerScrolledRecently = Date.now() - engine.lastUserScrollAt < USER_SCROLL_GRACE_MS;
    if (changedBlockRect && latestRef.current.autoScroll && !readerScrolledRecently) {
      scrollToNarrationBlock(changedBlockRect);
    }
  }, []);

  const play = useCallback(() => {
    const engine = engineRef.current;
    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }
    const loadedAudioIsCurrent = !!engine.loadedSegment && engine.loadedSegment.settingsKey === latestRef.current.settingsKey;
    if (engine.pendingTarget) {
      void playFrom(engine.pendingTarget);
    } else if (loadedAudioIsCurrent && latestRef.current.phase !== "ended") {
      void audioElement.play();
    } else {
      void playFrom({ type: "fraction", segmentIndex: 0, fraction: 0 });
    }
  }, [playFrom]);

  const pause = useCallback(() => {
    engineRef.current.commandToken++;
    audioRef.current?.pause();
    setStatusMessage(null);
    setPhase(currentPhase => currentPhase === "idle" ? "idle" : "paused");
  }, []);

  const seekTo = useCallback((timelineMs: number) => {
    const engine = engineRef.current;
    const audioElement = audioRef.current;
    const durations = latestRef.current.segmentDurations;
    if (!audioElement || !durations) {
      return;
    }
    const { segmentIndex, fraction } = locateOnTimeline(durations, timelineMs);
    const loadedSegment = engine.loadedSegment;
    if (loadedSegment && loadedSegment.segmentIndex === segmentIndex && loadedSegment.settingsKey === latestRef.current.settingsKey) {
      audioElement.currentTime = fraction * loadedSegment.audio.durationMs / 1000;
    } else {
      void playFrom({ type: "fraction", segmentIndex, fraction });
    }
  }, [playFrom]);

  const skip = useCallback((deltaMs: number) => {
    seekTo(Math.max(0, latestRef.current.positionMs + deltaMs));
  }, [seekTo]);

  const setPlaybackRate = useCallback((newPlaybackRate: number) => {
    setPlaybackRateState(newPlaybackRate);
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.defaultPlaybackRate = newPlaybackRate;
      audioElement.playbackRate = newPlaybackRate;
    }
  }, []);

  const audioEventHandlers = useMemo(() => ({
    onPlaying: () => setPhase("playing"),
    onPause: () => {
      if (!audioRef.current?.ended) {
        setPhase(currentPhase => currentPhase === "playing" ? "paused" : currentPhase);
      }
    },
    onEnded: () => {
      const nextSegmentIndex = (engineRef.current.loadedSegment?.segmentIndex ?? 0) + 1;
      if (nextSegmentIndex < (latestRef.current.segmentDurations?.length ?? 0)) {
        void playFrom({ type: "fraction", segmentIndex: nextSegmentIndex, fraction: 0 });
      } else {
        setPhase("ended");
      }
    },
    onTimeUpdate: () => setSegmentTimeMs((audioRef.current?.currentTime ?? 0) * 1000),
    onSeeked: () => {
      // Seeking back after the narration has finished means there's something
      // left to play, so the next press of play should resume from here
      // rather than start over.
      if (!audioRef.current?.ended) {
        setPhase(currentPhase => currentPhase === "ended" ? "paused" : currentPhase);
      }
      updateHighlight();
    },
    onError: () => {
      setPhase("error");
      setErrorMessage("The audio couldn't be loaded");
    },
  }), [playFrom, updateHighlight]);

  // Find out which segments already have audio with these settings, so that
  // the timeline can use their real lengths.
  useEffect(() => {
    const voiceSettings = latestRef.current.settings;
    if (!prepared || !voiceSettings || !settingsKey) {
      return;
    }
    let isCurrent = true;
    void apolloClient.query({
      query: NarrationSegmentAudiosQuery,
      variables: { narrationScriptId: prepared.narrationScriptId, settings: voiceSettings },
      fetchPolicy: "network-only",
    }).then(({ data }) => {
      if (!isCurrent) {
        return;
      }
      const existingDurations = Object.fromEntries((data?.narrationSegmentAudios ?? []).map(
        audio => [getSegmentAudioKey(settingsKey, audio.narrationSegmentId), audio.durationMs]
      ));
      setKnownDurations(durations => ({ ...existingDurations, ...durations }));
    });
    return () => {
      isCurrent = false;
    };
  }, [apolloClient, prepared, settingsKey]);

  // When the voice settings change partway through, continue from the block
  // being read, in the new voice.
  useEffect(() => {
    const { loadedSegment, pendingTarget } = engineRef.current;
    const audioElement = audioRef.current;
    if (!settingsKey || !audioElement) {
      return;
    }
    if (pendingTarget) {
      if (latestRef.current.phase === "loading") {
        void playFrom(pendingTarget);
      }
      return;
    }
    if (!loadedSegment || loadedSegment.settingsKey === settingsKey) {
      return;
    }
    const currentBlock = findBlockTimingAt(loadedSegment.audio.timings, audioElement.currentTime * 1000);
    if (currentBlock) {
      void playFrom({ type: "block", blockIndex: currentBlock.blockIndex });
    }
  }, [settingsKey, playFrom]);

  useEffect(() => {
    const root = document.getElementById(POST_CONTENT_ELEMENT_ID);
    if (!prepared || !root) {
      return;
    }
    const engine = engineRef.current;
    const highlighter = createNarrationHighlighter(prepared.script, root);
    engine.highlighter = highlighter;

    const jumpToDoubleClickedBlock = (event: MouseEvent) => {
      const clickedNode = window.getSelection()?.anchorNode ?? (event.target instanceof Node ? event.target : null);
      const blockIndex = clickedNode ? findScriptBlockIndexForNode(highlighter, clickedNode) : null;
      if (blockIndex !== null) {
        void playFrom({ type: "block", blockIndex });
      }
    };
    root.addEventListener("dblclick", jumpToDoubleClickedBlock);

    return () => {
      root.removeEventListener("dblclick", jumpToDoubleClickedBlock);
      clearNarrationHighlight(highlighter);
      engine.highlighter = null;
    };
  }, [prepared, playFrom]);

  useEffect(() => {
    if (phase !== "playing") {
      return;
    }
    let animationFrame = requestAnimationFrame(function highlightEachFrame() {
      updateHighlight();
      animationFrame = requestAnimationFrame(highlightEachFrame);
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [phase, updateHighlight]);

  useEffect(() => {
    const engine = engineRef.current;
    const noteUserScroll = () => {
      engine.lastUserScrollAt = Date.now();
    };
    const noteScrollKey = (event: KeyboardEvent) => {
      if (scrollKeys.has(event.key)) {
        noteUserScroll();
      }
    };
    window.addEventListener("wheel", noteUserScroll, { passive: true });
    window.addEventListener("touchmove", noteUserScroll, { passive: true });
    window.addEventListener("keydown", noteScrollKey);
    return () => {
      window.removeEventListener("wheel", noteUserScroll);
      window.removeEventListener("touchmove", noteUserScroll);
      window.removeEventListener("keydown", noteScrollKey);
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    const audioElement = audioRef.current;
    return () => {
      engine.commandToken++;
      audioElement?.pause();
    };
  }, []);

  return {
    audioRef,
    audioEventHandlers,
    phase,
    statusMessage,
    errorMessage,
    positionMs,
    durationMs,
    durationIsEstimated,
    playbackRate,
    play,
    pause,
    seekTo,
    skip,
    setPlaybackRate,
  };
}
