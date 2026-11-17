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

export type NarrationVoiceTuning = Omit<NarrationVoiceSettings, "voiceId"|"modelId">;

interface NarrationTuningRange {
  min: number
  max: number
  label: string
}

/** The ranges that the ElevenLabs API accepts */
export const narrationTuningRanges: Record<keyof NarrationVoiceTuning, NarrationTuningRange> = {
  stability: { min: 0, max: 1, label: "Stability" },
  similarityBoost: { min: 0, max: 1, label: "Similarity" },
  style: { min: 0, max: 1, label: "Style exaggeration" },
  speed: { min: 0.7, max: 1.2, label: "Generation speed" },
};

export const narrationTuningKeys: Array<keyof NarrationVoiceTuning> = ["stability", "similarityBoost", "style", "speed"];

export const defaultNarrationVoiceTuning: NarrationVoiceTuning = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0,
  speed: 1,
};

export const DEFAULT_NARRATION_MODEL_ID = "eleven_multilingual_v2";

/**
 * A range of a block's speech text, and the range of the block's source text
 * that it was made from. If `atomic`, the speech isn't a character-for-character
 * copy of the source (it's an equation read aloud, for example), so any part
 * of the speech range corresponds to the whole source range.
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
