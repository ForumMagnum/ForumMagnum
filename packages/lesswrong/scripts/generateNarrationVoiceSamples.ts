import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { DEFAULT_NARRATION_MODEL_ID, narrationVoiceTuning } from "@/lib/narration/narrationTypes";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { synthesizeSpeechWithTimestamps } from "@/server/narration/elevenLabs";
import { getVoiceSamplePath, listUserSelectableVoices, type NarrationVoice } from "@/server/narration/narrationVoices";

/* eslint-disable no-console */

/**
 * Makes the recordings that are played to someone who's choosing between
 * narration voices: each voice saying SAMPLE_TEXT, with the model and tuning
 * that narration uses. They're written to /public, to be checked in. Run this
 * again, and check in what it writes, when a voice is added or the sentence
 * changes.
 *
 * Usage:
 *   npm run repl -- dev lw packages/lesswrong/scripts/generateNarrationVoiceSamples.ts "generateNarrationVoiceSamples()"
 */

const SAMPLE_TEXT = "The first virtue is curiosity. A burning itch to know is higher than a solemn vow to pursue truth.";
const CONCURRENCY = 3;

async function generateSample(voice: NarrationVoice) {
  const speech = await synthesizeSpeechWithTimestamps({
    text: SAMPLE_TEXT,
    previousText: null,
    nextText: null,
    settings: { voiceId: voice.voiceId, modelId: DEFAULT_NARRATION_MODEL_ID, ...narrationVoiceTuning },
  });
  const samplePath = path.join(process.cwd(), "public", getVoiceSamplePath(voice.voiceId));
  await mkdir(path.dirname(samplePath), { recursive: true });
  await writeFile(samplePath, speech.audio);

  const seconds = speech.alignment.character_end_times_seconds.at(-1);
  console.log(`${voice.name}: ${seconds?.toFixed(1)}s, ${speech.audio.byteLength} bytes, to ${samplePath}`);
}

export async function generateNarrationVoiceSamples() {
  const voices = listUserSelectableVoices();
  await executePromiseQueue(voices.map(voice => () => generateSample(voice)), CONCURRENCY);
  console.log(`Wrote samples of ${voices.length} voices`);
}
