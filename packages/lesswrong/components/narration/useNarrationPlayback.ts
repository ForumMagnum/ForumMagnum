import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import sum from "lodash/sum";
import { gql } from "@/lib/generated/gql-codegen";
import { isCommentNarratable } from "@/lib/narration/narratableComments";
import type { NarrationScript, NarrationSegmentTimings, NarrationVoiceSettings } from "@/lib/narration/narrationTypes";
import {
  findCommentBodyElement,
  findNarrationComment,
  findNarrationCommentForElement,
  getNextNarrationComment,
  setNarrationFocusedComment,
} from "./narrationComments";
import {
  createNarrationHighlighter,
  disposeNarrationHighlighter,
  findBlockTimingAt,
  findScriptBlockIndexForNode,
  scrollToNarrationPosition,
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

const PrepareCommentNarrationMutation = gql(`
  mutation PrepareCommentNarrationMutation($commentId: String!) {
    prepareCommentNarration(commentId: $commentId) {
      ...NarrationScriptFragment
    }
  }
`);

const GenerateNarrationSegmentAudioMutation = gql(`
  mutation GenerateNarrationSegmentAudioMutation($narrationSegmentId: String!, $settings: NarrationVoiceSettingsInput) {
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
/** Comments are read in their authors' voices, which the server looks up, so their audio isn't kept by voice settings */
const AUTHOR_VOICE_KEY = "author";
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

interface FinishedSegmentAudio {
  audioUrl: string
  timingsUrl: string
  durationMs: number
}

/**
 * Something that's narrated as a unit, with a script and a timeline of its
 * own: the post, or one of its comments. Playback goes from the post into the
 * comments, and then from each comment to the next.
 */
export type NarrationItem =
  | { type: "post", postId: string }
  | { type: "comment", commentId: string };

/**
 * Where in an item to start playing from: partway through a segment, at the
 * start of a block of the script, or at the block that a node of the page is
 * in (the start of the item, if it isn't in one).
 */
type PlaybackPosition =
  | { type: "fraction", segmentIndex: number, fraction: number }
  | { type: "block", blockIndex: number }
  | { type: "node", node: Node };

interface PlaybackTarget {
  item: NarrationItem
  position: PlaybackPosition
}

interface EngineState {
  /** Keyed by item; see getItemKey */
  prepared: Map<string, Promise<PreparedNarration>>
  /** Keyed by voice and segment; see getSegmentAudioKey */
  segmentAudios: Map<string, Promise<LoadedSegmentAudio>>
  /** What the audio element currently holds */
  loadedSegment: {
    item: NarrationItem
    segmentIndex: number
    /** How many segments the item has */
    segmentCount: number
    voiceKey: string
    audio: LoadedSegmentAudio
  }|null
  /** Incremented whenever playback is redirected, so that work started for an earlier request can tell it's been superseded */
  commandToken: number
  /** Where playback was last asked to start from, until the audio for it has been loaded */
  pendingTarget: PlaybackTarget|null
  /** Highlights what's being read in the item that the player is showing */
  highlighter: NarrationHighlighter|null
  highlighterItemKey: string|null
  lastUserScrollAt: number
  /**
   * Comments that would be skipped for having no karma, but that the listener
   * asked for by starting playback in one of them, or in a reply under them
   */
  unlockedCommentIds: Set<string>
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
  /** What's being narrated. The position and duration are within this. */
  currentItem: NarrationItem
  positionMs: number
  /** Null until the item's script has been loaded */
  durationMs: number|null
  durationIsEstimated: boolean
  play: () => void
  pause: () => void
  seekTo: (timelineMs: number) => void
  skip: (deltaMs: number) => void
}

function getSettingsKey(settings: NarrationVoiceSettings): string {
  return JSON.stringify([settings.voiceId, settings.modelId, settings.stability, settings.similarityBoost, settings.style, settings.speed]);
}

function getItemKey(item: NarrationItem): string {
  return item.type === "post" ? `post:${item.postId}` : `comment:${item.commentId}`;
}

/** Identifies the voice that an item is read in. Null for a post, if the settings to read it with aren't known yet. */
function getVoiceKey(item: NarrationItem, settings: NarrationVoiceSettings|null): string|null {
  if (item.type === "comment") {
    return AUTHOR_VOICE_KEY;
  }
  return settings ? getSettingsKey(settings) : null;
}

function getSegmentAudioKey(voiceKey: string, segmentId: string): string {
  return `${voiceKey}:${segmentId}`;
}

/**
 * A segment's audio has no file, timings or duration while it's being
 * generated. The server only sends audio that's finished (it waits for audio
 * that's on its way), so this is for the sake of the types.
 */
function getFinishedSegmentAudio(audio: NarrationSegmentAudioFragment): FinishedSegmentAudio {
  const { audioUrl, timingsUrl, durationMs } = audio;
  if (audioUrl === null || timingsUrl === null || durationMs === null) {
    throw new Error(`Narration audio ${audio._id} was sent before it was finished`);
  }
  return { audioUrl, timingsUrl, durationMs };
}

function getItemRoot(item: NarrationItem): Element|null {
  return item.type === "post" ? document.getElementById(POST_CONTENT_ELEMENT_ID) : findCommentBodyElement(item.commentId);
}

const startOfItem: PlaybackPosition = { type: "fraction", segmentIndex: 0, fraction: 0 };

/** The segment that a position is in, and the block to start at, if it's a particular block */
function locateInScript(prepared: PreparedNarration, { item, position }: PlaybackTarget): { segmentIndex: number, blockIndex: number|null, fraction: number } {
  if (position.type === "fraction") {
    return { segmentIndex: position.segmentIndex, blockIndex: null, fraction: position.fraction };
  }
  const blockIndex = position.type === "block"
    ? position.blockIndex
    : findBlockIndexForNode(prepared.script, item, position.node);
  if (blockIndex === null) {
    return { segmentIndex: 0, blockIndex: null, fraction: 0 };
  }
  const segmentIndex = prepared.segments.findIndex(segment => segment.startBlockIndex <= blockIndex && blockIndex < segment.endBlockIndex);
  return { segmentIndex, blockIndex, fraction: 0 };
}

function findBlockIndexForNode(script: NarrationScript, item: NarrationItem, node: Node): number|null {
  const highlighter = createNarrationHighlighter(script, () => getItemRoot(item));
  const blockIndex = findScriptBlockIndexForNode(highlighter, node);
  disposeNarrationHighlighter(highlighter);
  return blockIndex;
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
function getSegmentDurations(segments: NarrationSegmentInfo[], voiceKey: string, knownDurations: Record<string, number>): number[] {
  const measuredSegments = segments.filter(segment => getSegmentAudioKey(voiceKey, segment._id) in knownDurations);
  const measuredMs = sum(measuredSegments.map(segment => knownDurations[getSegmentAudioKey(voiceKey, segment._id)]));
  const measuredCharacters = sum(measuredSegments.map(segment => segment.characterCount));
  const msPerCharacter = measuredCharacters > 0 ? measuredMs / measuredCharacters : DEFAULT_MS_PER_CHARACTER;
  return segments.map(segment =>
    knownDurations[getSegmentAudioKey(voiceKey, segment._id)] ?? (segment.characterCount * msPerCharacter)
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


function getNextItem(item: NarrationItem, unlockedCommentIds: ReadonlySet<string>): NarrationItem|null {
  const nextComment = getNextNarrationComment(item.type === "comment" ? item.commentId : null, unlockedCommentIds);
  return nextComment ? { type: "comment", commentId: nextComment.comment._id } : null;
}

/**
 * What a double-click on an element asks to hear: the post, if it's in the
 * post's body, or the comment whose text it's part of. Choosing a comment
 * also unlocks it and the comments it's nested under, so that it's read even
 * if it would have been skipped for having no karma.
 */
function findItemForElement(element: Element, postItem: NarrationItem): { item: NarrationItem, unlockedCommentIds: Set<string> }|null {
  if (element.closest(`#${POST_CONTENT_ELEMENT_ID}`)) {
    return { item: postItem, unlockedCommentIds: new Set() };
  }
  const commentEntry = findNarrationCommentForElement(element);
  if (!commentEntry || !isCommentNarratable(commentEntry.comment)) {
    return null;
  }
  return {
    item: { type: "comment", commentId: commentEntry.comment._id },
    unlockedCommentIds: new Set([...commentEntry.ancestors, commentEntry.comment].map(comment => comment._id)),
  };
}

/**
 * Plays the narration of a post and then of its comments, through a single
 * audio element. Each of those (an "item") has a script of its own, divided
 * into segments. Audio for a segment is requested (and generated, if nobody
 * has listened to it in that voice before) when playback reaches it, and what
 * comes after the segment being played is requested ahead of time: the item's
 * next segment, or the first segment of the next item.
 */
export function useNarrationPlayback({ postId, settings, autoScroll, playbackRate }: {
  postId: string
  /** The voice to read the post in. Null until the settings to use are known; the post can't be played before then. */
  settings: NarrationVoiceSettings|null
  autoScroll: boolean
  playbackRate: number
}): NarrationPlayback {
  const apolloClient = useApolloClient();
  const [preparePostNarration] = useMutation(PrepareNarrationMutation);
  const [prepareCommentNarration] = useMutation(PrepareCommentNarrationMutation);
  const [generateSegmentAudio] = useMutation(GenerateNarrationSegmentAudioMutation);

  const audioRef = useRef<HTMLAudioElement|null>(null);
  const engineRef = useRef<EngineState>({
    prepared: new Map(),
    segmentAudios: new Map(),
    loadedSegment: null,
    commandToken: 0,
    pendingTarget: null,
    highlighter: null,
    highlighterItemKey: null,
    lastUserScrollAt: 0,
    unlockedCommentIds: new Set(),
  });

  const postItem = useMemo((): NarrationItem => ({ type: "post", postId }), [postId]);

  const [phase, setPhase] = useState<NarrationPhase>("idle");
  const [statusMessage, setStatusMessage] = useState<string|null>(null);
  const [errorMessage, setErrorMessage] = useState<string|null>(null);
  const [currentItem, setCurrentItem] = useState<NarrationItem>(postItem);
  /** The scripts that have been loaded. Keyed like EngineState.prepared. */
  const [preparedByItemKey, setPreparedByItemKey] = useState<Partial<Record<string, PreparedNarration>>>({});
  /** How long each segment's audio is, for those that have been generated. Keyed like EngineState.segmentAudios. */
  const [knownDurations, setKnownDurations] = useState<Record<string, number>>({});
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [segmentTimeMs, setSegmentTimeMs] = useState(0);

  const settingsKey = settings ? getSettingsKey(settings) : null;
  const currentItemKey = getItemKey(currentItem);
  const prepared = preparedByItemKey[currentItemKey] ?? null;
  const postPrepared = preparedByItemKey[getItemKey(postItem)] ?? null;
  const voiceKey = getVoiceKey(currentItem, settings);

  const segmentDurations = useMemo(
    () => (prepared && voiceKey) ? getSegmentDurations(prepared.segments, voiceKey, knownDurations) : null,
    [prepared, voiceKey, knownDurations],
  );
  const durationIsEstimated = !!prepared && !!voiceKey && prepared.segments.some(
    segment => !(getSegmentAudioKey(voiceKey, segment._id) in knownDurations)
  );

  const positionMs = segmentDurations ? sum(segmentDurations.slice(0, currentSegmentIndex)) + segmentTimeMs : 0;
  const durationMs = segmentDurations ? sum(segmentDurations) : null;

  const latestRef = useRef({ settings, settingsKey, currentItem, segmentDurations, positionMs, playbackRate, autoScroll, phase });
  latestRef.current = { settings, settingsKey, currentItem, segmentDurations, positionMs, playbackRate, autoScroll, phase };

  const requestNarrationScript = useCallback(async (item: NarrationItem): Promise<NarrationScriptFragment|null|undefined> => {
    if (item.type === "post") {
      const { data } = await preparePostNarration({ variables: { postId: item.postId } });
      return data?.prepareNarration;
    }
    const { data } = await prepareCommentNarration({ variables: { commentId: item.commentId } });
    return data?.prepareCommentNarration;
  }, [preparePostNarration, prepareCommentNarration]);

  const ensurePrepared = useCallback((item: NarrationItem): Promise<PreparedNarration> => {
    const engine = engineRef.current;
    const itemKey = getItemKey(item);
    const alreadyPreparing = engine.prepared.get(itemKey);
    if (alreadyPreparing) {
      return alreadyPreparing;
    }
    const preparing = (async () => {
      const narrationScript = await requestNarrationScript(item);
      if (!narrationScript?.scriptUrl) {
        throw new Error("Preparing the narration didn't return a finished script");
      }
      const script = await fetchJson<NarrationScript>(narrationScript.scriptUrl);
      const result = { narrationScriptId: narrationScript._id, segments: narrationScript.segments, script };
      setPreparedByItemKey(preparedItems => ({ ...preparedItems, [itemKey]: result }));
      return result;
    })();
    engine.prepared.set(itemKey, preparing);
    preparing.catch(() => {
      if (engine.prepared.get(itemKey) === preparing) {
        engine.prepared.delete(itemKey);
      }
    });
    return preparing;
  }, [requestNarrationScript]);

  const loadSegmentAudio = useCallback((
    segment: NarrationSegmentInfo,
    item: NarrationItem,
    voiceSettings: NarrationVoiceSettings|null,
  ): Promise<LoadedSegmentAudio> => {
    const engine = engineRef.current;
    const itemVoiceKey = getVoiceKey(item, voiceSettings);
    if (!itemVoiceKey) {
      return Promise.reject(new Error("No voice has been chosen to read the post in"));
    }
    const audioKey = getSegmentAudioKey(itemVoiceKey, segment._id);
    const alreadyLoading = engine.segmentAudios.get(audioKey);
    if (alreadyLoading) {
      return alreadyLoading;
    }
    const loading = (async () => {
      const { data } = await generateSegmentAudio({ variables: {
        narrationSegmentId: segment._id,
        settings: item.type === "post" ? voiceSettings : null,
      } });
      const audio = data?.generateNarrationSegmentAudio;
      if (!audio) {
        throw new Error("Generating audio returned nothing");
      }
      const { audioUrl, timingsUrl, durationMs } = getFinishedSegmentAudio(audio);
      const timings = await fetchJson<NarrationSegmentTimings>(timingsUrl);
      setKnownDurations(durations => ({ ...durations, [audioKey]: durationMs }));
      return { audioUrl, durationMs, timings };
    })();
    engine.segmentAudios.set(audioKey, loading);
    loading.catch(() => {
      if (engine.segmentAudios.get(audioKey) === loading) {
        engine.segmentAudios.delete(audioKey);
      }
    });
    return loading;
  }, [generateSegmentAudio]);

  /** Requests what will be played after a segment, so that it's ready by then */
  const loadWhatFollows = useCallback(async (
    item: NarrationItem,
    preparedNarration: PreparedNarration,
    segmentIndex: number,
    voiceSettings: NarrationVoiceSettings|null,
  ) => {
    const nextSegment = preparedNarration.segments.at(segmentIndex + 1);
    if (nextSegment) {
      await loadSegmentAudio(nextSegment, item, voiceSettings);
      return;
    }
    const nextItem = getNextItem(item, engineRef.current.unlockedCommentIds);
    const nextItemFirstSegment = nextItem ? (await ensurePrepared(nextItem)).segments.at(0) : null;
    if (nextItem && nextItemFirstSegment) {
      await loadSegmentAudio(nextItemFirstSegment, nextItem, voiceSettings);
    }
  }, [ensurePrepared, loadSegmentAudio]);

  /** Makes an item the one that the player shows the timeline of. A comment is also expanded, if it wasn't. */
  const showItem = useCallback((item: NarrationItem) => {
    if (getItemKey(item) !== getItemKey(latestRef.current.currentItem)) {
      setCurrentItem(item);
      setCurrentSegmentIndex(0);
      setSegmentTimeMs(0);
    }
    setNarrationFocusedComment(item.type === "comment" ? findNarrationComment(item.commentId) : null);
  }, []);

  const playFrom = useCallback(async (target: PlaybackTarget) => {
    const engine = engineRef.current;
    const audioElement = audioRef.current;
    const voiceSettings = latestRef.current.settings;
    const targetVoiceKey = getVoiceKey(target.item, voiceSettings);
    if (!audioElement || !targetVoiceKey) {
      return;
    }
    const commandToken = ++engine.commandToken;
    engine.pendingTarget = target;
    audioElement.pause();
    setPhase("loading");
    setErrorMessage(null);
    showItem(target.item);

    try {
      setStatusMessage("Preparing narration…");
      const preparedNarration = await ensurePrepared(target.item);
      if (commandToken !== engine.commandToken) {
        return;
      }
      const { segmentIndex, blockIndex, fraction } = locateInScript(preparedNarration, target);
      const segment = preparedNarration.segments.at(segmentIndex);
      if (segmentIndex < 0 || !segment) {
        throw new Error("That part of the page isn't in the narration");
      }

      setStatusMessage("Generating audio…");
      const segmentAudio = await loadSegmentAudio(segment, target.item, voiceSettings);
      if (commandToken !== engine.commandToken) {
        return;
      }
      const offsetMs = blockIndex !== null
        ? segmentAudio.timings.blocks.find(block => block.blockIndex === blockIndex)?.startMs ?? 0
        : fraction * segmentAudio.durationMs;

      if (engine.loadedSegment?.audio.audioUrl !== segmentAudio.audioUrl) {
        audioElement.src = segmentAudio.audioUrl;
      }
      engine.loadedSegment = {
        item: target.item,
        segmentIndex,
        segmentCount: preparedNarration.segments.length,
        voiceKey: targetVoiceKey,
        audio: segmentAudio,
      };
      engine.pendingTarget = null;
      audioElement.currentTime = offsetMs / 1000;
      audioElement.defaultPlaybackRate = latestRef.current.playbackRate;
      audioElement.playbackRate = latestRef.current.playbackRate;
      setCurrentSegmentIndex(segmentIndex);
      setSegmentTimeMs(offsetMs);
      setStatusMessage(null);

      // A failure here will come up again, and be reported, when playback gets there
      void loadWhatFollows(target.item, preparedNarration, segmentIndex, voiceSettings).catch(() => {});
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
  }, [ensurePrepared, loadSegmentAudio, loadWhatFollows, showItem]);

  const updateHighlight = useCallback(() => {
    const engine = engineRef.current;
    const audioElement = audioRef.current;
    const loadedSegment = engine.loadedSegment;
    if (!engine.highlighter || !loadedSegment || !audioElement || getItemKey(loadedSegment.item) !== engine.highlighterItemKey) {
      return;
    }
    const newPositionRect = updateNarrationHighlight(
      engine.highlighter,
      loadedSegment.audio.timings,
      audioElement.currentTime * 1000,
    );
    const readerScrolledRecently = Date.now() - engine.lastUserScrollAt < USER_SCROLL_GRACE_MS;
    if (newPositionRect && latestRef.current.autoScroll && !readerScrolledRecently) {
      scrollToNarrationPosition(newPositionRect);
    }
  }, []);

  const play = useCallback(() => {
    const engine = engineRef.current;
    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }
    const loadedSegment = engine.loadedSegment;
    const loadedAudioIsCurrent = !!loadedSegment && loadedSegment.voiceKey === getVoiceKey(loadedSegment.item, latestRef.current.settings);
    if (engine.pendingTarget) {
      void playFrom(engine.pendingTarget);
    } else if (loadedAudioIsCurrent && latestRef.current.phase !== "ended") {
      void audioElement.play();
    } else {
      engine.unlockedCommentIds = new Set();
      void playFrom({ item: postItem, position: startOfItem });
    }
  }, [playFrom, postItem]);

  const pause = useCallback(() => {
    engineRef.current.commandToken++;
    audioRef.current?.pause();
    setStatusMessage(null);
    setPhase(currentPhase => currentPhase === "idle" ? "idle" : "paused");
  }, []);

  const seekTo = useCallback((timelineMs: number) => {
    const audioElement = audioRef.current;
    const { currentItem: shownItem, segmentDurations: durations, settings: voiceSettings } = latestRef.current;
    if (!audioElement || !durations) {
      return;
    }
    const { segmentIndex, fraction } = locateOnTimeline(durations, timelineMs);
    const loadedSegment = engineRef.current.loadedSegment;
    const soughtSegmentIsLoaded = !!loadedSegment
      && getItemKey(loadedSegment.item) === getItemKey(shownItem)
      && loadedSegment.segmentIndex === segmentIndex
      && loadedSegment.voiceKey === getVoiceKey(shownItem, voiceSettings);
    if (loadedSegment && soughtSegmentIsLoaded) {
      audioElement.currentTime = fraction * loadedSegment.audio.durationMs / 1000;
    } else {
      void playFrom({ item: shownItem, position: { type: "fraction", segmentIndex, fraction } });
    }
  }, [playFrom]);

  const skip = useCallback((deltaMs: number) => {
    seekTo(Math.max(0, latestRef.current.positionMs + deltaMs));
  }, [seekTo]);

  const audioEventHandlers = useMemo(() => ({
    onPlaying: () => setPhase("playing"),
    onPause: () => {
      if (!audioRef.current?.ended) {
        setPhase(currentPhase => currentPhase === "playing" ? "paused" : currentPhase);
      }
    },
    onEnded: () => {
      const { loadedSegment, unlockedCommentIds } = engineRef.current;
      if (!loadedSegment) {
        return;
      }
      const nextSegmentIndex = loadedSegment.segmentIndex + 1;
      const nextItem = getNextItem(loadedSegment.item, unlockedCommentIds);
      if (nextSegmentIndex < loadedSegment.segmentCount) {
        void playFrom({ item: loadedSegment.item, position: { type: "fraction", segmentIndex: nextSegmentIndex, fraction: 0 } });
      } else if (nextItem) {
        void playFrom({ item: nextItem, position: startOfItem });
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

  // The post's script is loaded as soon as the player opens, rather than when
  // play is first pressed, so that the timeline shows the narration's length
  // and double-clicking a paragraph works straight away.
  useEffect(() => {
    ensurePrepared(postItem).catch((error: unknown) => {
      setPhase(currentPhase => currentPhase === "idle" ? "error" : currentPhase);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    });
  }, [ensurePrepared, postItem]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      // Loading a new source resets playbackRate to defaultPlaybackRate
      audioElement.defaultPlaybackRate = playbackRate;
      audioElement.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Find out which of the post's segments already have audio with these
  // settings, so that the timeline can use their real lengths.
  useEffect(() => {
    const voiceSettings = latestRef.current.settings;
    if (!postPrepared || !voiceSettings || !settingsKey) {
      return;
    }
    let isCurrent = true;
    void apolloClient.query({
      query: NarrationSegmentAudiosQuery,
      variables: { narrationScriptId: postPrepared.narrationScriptId, settings: voiceSettings },
      fetchPolicy: "network-only",
    }).then(({ data }) => {
      if (!isCurrent) {
        return;
      }
      const existingDurations = Object.fromEntries((data?.narrationSegmentAudios ?? []).map(
        audio => [getSegmentAudioKey(settingsKey, audio.narrationSegmentId), getFinishedSegmentAudio(audio).durationMs]
      ));
      setKnownDurations(durations => ({ ...existingDurations, ...durations }));
    });
    return () => {
      isCurrent = false;
    };
  }, [apolloClient, postPrepared, settingsKey]);

  // When the voice settings change partway through the post, continue from
  // the block being read, in the new voice. (They don't apply to comments.)
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
    if (!loadedSegment || loadedSegment.item.type !== "post" || loadedSegment.voiceKey === settingsKey) {
      return;
    }
    const currentBlock = findBlockTimingAt(loadedSegment.audio.timings, audioElement.currentTime * 1000);
    if (currentBlock) {
      void playFrom({ item: loadedSegment.item, position: { type: "block", blockIndex: currentBlock.blockIndex } });
    }
  }, [settingsKey, playFrom]);

  useEffect(() => {
    if (!prepared) {
      return;
    }
    const engine = engineRef.current;
    const highlighter = createNarrationHighlighter(prepared.script, () => getItemRoot(currentItem));
    engine.highlighter = highlighter;
    engine.highlighterItemKey = getItemKey(currentItem);
    return () => {
      disposeNarrationHighlighter(highlighter);
      engine.highlighter = null;
      engine.highlighterItemKey = null;
    };
  }, [prepared, currentItem]);

  useEffect(() => {
    const engine = engineRef.current;
    const jumpToDoubleClickedPlace = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const clickedItem = target ? findItemForElement(target, postItem) : null;
      if (!target || !clickedItem) {
        return;
      }
      // Double-clicking text selects a word, which says where the click was
      // more precisely than the element it landed on does. Double-clicking an
      // image selects nothing, and leaves any earlier selection in place.
      const clickedNode = target instanceof HTMLImageElement ? target : (window.getSelection()?.anchorNode ?? target);

      // In what's already showing, a double-click that isn't on anything
      // that's narrated (in the space between paragraphs, say) does nothing.
      // In a comment that playback hasn't been to, it starts the comment.
      const shownItemHighlighter = getItemKey(clickedItem.item) === engine.highlighterItemKey ? engine.highlighter : null;
      const blockIndex = shownItemHighlighter ? findScriptBlockIndexForNode(shownItemHighlighter, clickedNode) : null;
      if (shownItemHighlighter && blockIndex === null) {
        return;
      }
      engine.unlockedCommentIds = clickedItem.unlockedCommentIds;
      void playFrom({
        item: clickedItem.item,
        position: blockIndex !== null ? { type: "block", blockIndex } : { type: "node", node: clickedNode },
      });
    };
    document.addEventListener("dblclick", jumpToDoubleClickedPlace);
    return () => document.removeEventListener("dblclick", jumpToDoubleClickedPlace);
  }, [playFrom, postItem]);

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
      setNarrationFocusedComment(null);
    };
  }, []);

  return {
    audioRef,
    audioEventHandlers,
    phase,
    statusMessage,
    errorMessage,
    currentItem,
    positionMs,
    durationMs,
    durationIsEstimated,
    play,
    pause,
    seekTo,
    skip,
  };
}
