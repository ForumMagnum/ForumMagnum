/**
 * The settings that audio is generated with. Generated audio is cached per
 * segment per distinct combination of these.
 */
export interface NarrationVoiceSettings {
  voiceId: string
  modelId: string
  stability: number
  similarityBoost: number
  style: number
  speed: number
}

/** How a voice is made to sound. Listeners don't choose this: all audio is generated with the same tuning. */
export const narrationVoiceTuning: Omit<NarrationVoiceSettings, "voiceId"|"modelId"> = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0,
  speed: 1,
};

/** The speech model that everything is read with, unless an admin chooses another (Eleven v4 Turbo) */
export const DEFAULT_NARRATION_MODEL_ID = "eleven_v4_turbo";

/**
 * Takes the place of a voice's ID, to mean the voice of whoever wrote what's
 * being read. Every user has a voice of their own.
 */
export const AUTHOR_NARRATION_VOICE = "author";

/** What a listener asks to hear something read in */
export interface NarrationVoiceChoice {
  /** A voice's ID, or AUTHOR_NARRATION_VOICE */
  voiceId: string
  modelId: string
}

/** A listener's settings: what to hear posts read in, and what to hear comments read in */
export interface NarrationListenerSettings {
  /** A voice's ID, or AUTHOR_NARRATION_VOICE */
  postVoiceId: string
  /** The same, for comments */
  commentVoiceId: string
  modelId: string
}

/**
 * A range of a block's speech text, and the range of the block's source text
 * that it was made from. If `atomic`, the speech isn't a character-for-character
 * copy of the source (it's an equation read aloud, for example), so any part
 * of the speech range corresponds to the whole source range.
 *
 * Blocks other than text blocks (table rows, and things that are announced
 * rather than read) have no source text. Their speech is covered by a single
 * atomic span, which stands for the whole block.
 */
export interface NarrationSpan {
  speechStart: number
  speechEnd: number
  sourceStart: number
  sourceEnd: number
  atomic: boolean
}

export interface NarrationScriptBlock {
  /**
   * Which block of the post this was made from, as an index into the post's
   * blocks in document order (see extractNarrationBlocks), with that block's
   * fingerprint. Null for speech that isn't made from part of the post body.
   */
  documentIndex: number|null
  fingerprint: string|null
  speech: string
  spans: NarrationSpan[]
}

/**
 * What a narration says, as a list of blocks in the order they're read. This
 * differs from document order: footnotes are read after the paragraph that
 * references them.
 */
export interface NarrationScript {
  blocks: NarrationScriptBlock[]
}

/** The text sent to the speech model for a segment is its blocks' speech, joined with this */
export const NARRATION_BLOCK_SEPARATOR = "\n\n";

export type NarrationWordTiming = [startMs: number, endMs: number, sourceStart: number, sourceEnd: number];

export interface NarrationBlockTiming {
  /** Index into NarrationScript.blocks */
  blockIndex: number
  startMs: number
  endMs: number
  /** The spoken words that correspond to part of the block's source text */
  words: NarrationWordTiming[]
}

export interface NarrationSegmentTimings {
  blocks: NarrationBlockTiming[]
}
