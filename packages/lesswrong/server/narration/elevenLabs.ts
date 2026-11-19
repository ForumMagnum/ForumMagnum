import { z } from "zod";
import type { NarrationVoiceSettings } from "@/lib/narration/narrationTypes";

const ELEVENLABS_API_ORIGIN = "https://api.elevenlabs.io";
const NARRATION_OUTPUT_FORMAT = "mp3_44100_128";

const modelsResponseSchema = z.array(z.object({
  model_id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  can_do_text_to_speech: z.boolean().nullish(),
}));

const alignmentSchema = z.object({
  characters: z.array(z.string()),
  character_start_times_seconds: z.array(z.number()),
  character_end_times_seconds: z.array(z.number()),
});

const speechWithTimestampsResponseSchema = z.object({
  audio_base64: z.string(),
  alignment: alignmentSchema,
});

export type ElevenLabsAlignment = z.infer<typeof alignmentSchema>;

export interface ElevenLabsModel {
  modelId: string
  name: string
  description: string|null
}

export interface SynthesizedSpeech {
  audio: Buffer
  alignment: ElevenLabsAlignment
  requestId: string|null
  billedCharacters: number|null
}

function getElevenLabsApiKey(): string {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }
  return apiKey;
}

async function elevenLabsRequest(path: string, body?: Record<string, unknown>): Promise<Response> {
  const response = await fetch(`${ELEVENLABS_API_ORIGIN}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "xi-api-key": getElevenLabsApiKey(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`ElevenLabs request to ${path} failed with status ${response.status}: ${await response.text()}`);
  }
  return response;
}

export async function listElevenLabsSpeechModels(): Promise<ElevenLabsModel[]> {
  const response = await elevenLabsRequest("/v1/models");
  const models = modelsResponseSchema.parse(await response.json());
  return models
    .filter(model => model.can_do_text_to_speech)
    .map(model => ({
      modelId: model.model_id,
      name: model.name,
      description: model.description ?? null,
    }));
}

function parseIntegerHeader(response: Response, headerName: string): number|null {
  const value = parseInt(response.headers.get(headerName) ?? "");
  return Number.isNaN(value) ? null : value;
}

/**
 * Generates speech for `text`, with the time at which each of its characters
 * is spoken. `previousText` and `nextText` are what's read before and after
 * it; they aren't spoken, but let the model continue the intonation across
 * separately generated pieces.
 */
export async function synthesizeSpeechWithTimestamps({ text, previousText, nextText, settings }: {
  text: string
  previousText: string|null
  nextText: string|null
  settings: NarrationVoiceSettings
}): Promise<SynthesizedSpeech> {
  const response = await elevenLabsRequest(
    `/v1/text-to-speech/${encodeURIComponent(settings.voiceId)}/with-timestamps?output_format=${NARRATION_OUTPUT_FORMAT}`,
    {
      text,
      model_id: settings.modelId,
      voice_settings: {
        stability: settings.stability,
        similarity_boost: settings.similarityBoost,
        style: settings.style,
        speed: settings.speed,
      },
      ...(previousText ? { previous_text: previousText } : {}),
      ...(nextText ? { next_text: nextText } : {}),
    },
  );
  const { audio_base64, alignment } = speechWithTimestampsResponseSchema.parse(await response.json());
  return {
    audio: Buffer.from(audio_base64, "base64"),
    alignment,
    requestId: response.headers.get("request-id"),
    billedCharacters: parseIntegerHeader(response, "character-cost"),
  };
}
