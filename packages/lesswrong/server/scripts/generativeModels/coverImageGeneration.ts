/*
 * AI-generated cover images for Best of LessWrong review winner posts.
 *
 * Bulk generation via repl:
 *   yarn repl prod packages/lesswrong/server/scripts/generativeModels/coverImageGeneration.ts 'getReviewWinnerArts()'
 *
 * Single-post generation via the /bestoflesswrongadmin page (generateCoverImagesForPost mutation),
 * or via repl:
 *   yarn repl prod packages/lesswrong/server/scripts/generativeModels/coverImageGeneration.ts 'generateCoverImagesForPost("postId")'
 *
 * Test illustration prompt generation only (no image generation):
 *   yarn repl prod packages/lesswrong/server/scripts/generativeModels/coverImageGeneration.ts 'previewIllustrations("postId")'
 */

import { z } from "zod";
import { getOpenAI } from '../../languageModels/languageModelIntegration';
import { getAnthropicClientOrThrow } from '@/server/languageModels/anthropicClient';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import ReviewWinners from '@/server/collections/reviewWinners/collection';
import ReviewWinnerArts from '@/server/collections/reviewWinnerArts/collection';
import { moveImageToCloudinary } from '../convertImagesToCloudinary';
import { fal as _fal } from '@fal-ai/client';
import sample from 'lodash/sample';
import { falApiKey } from '@/lib/instanceSettings';
import { artPrompt } from '@/lib/collections/reviewWinnerArts/constants';
import { createAdminContext } from '@/server/vulcan-lib/createContexts';
import { createReviewWinnerArt } from '@/server/collections/reviewWinnerArts/mutations';
import { createSplashArtCoordinate } from '@/server/collections/splashArtCoordinates/mutations';
import { REVIEW_YEAR } from '@/lib/reviewUtils';
import { gql } from '@/lib/generated/gql-codegen';
import { runQuery } from '@/server/vulcan-lib/query';
import { writeFile, readFile } from 'fs/promises';
import sharp from 'sharp';
import { executePromiseQueue } from '@/lib/utils/asyncUtils';

// ── Configuration ────────────────────────────────────────────────────

// Which image generation provider to use.
const IMAGE_PROVIDER: 'fal' | 'midjourney' = 'midjourney';

type OpenAiModel = 'gpt-5.2' | 'gpt-5-mini';
type AnthropicModel = 'claude-opus-4-7' | 'claude-sonnet-4-6';
type SupportedLlmModel = OpenAiModel | AnthropicModel;
type LlmProvider = 'openai' | 'anthropic';

// The LLM model to use for generating illustration descriptions.
// Change this to experiment with different models.
export const DEFAULT_ILLUSTRATION_MODEL: SupportedLlmModel = "claude-opus-4-7";

// ── Queries ──────────────────────────────────────────────────────────

const postWithMarkdownQuery = gql(`
  query postWithMarkdownForCoverImage($input: SinglePostInput) {
    post(input: $input) {
      result {
        _id
        title
        contents {
          markdown
        }
      }
    }
  }
`);

const postsWithMarkdownQuery = gql(`
  query postsWithMarkdownForCoverImage($input: MultiPostInput) {
    posts(input: $input) {
      results {
        _id
        title
        contents {
          markdown
        }
      }
    }
  }
`);

// ── Types ────────────────────────────────────────────────────────────

interface Essay {
  postId: string;
  title: string;
  content: string;
  neededArtCount: number;
  promptsGenerated: number;
}

interface EssayResult {
  title: string;
  prompt: string;
  imageUrl: string;
  reviewWinnerArt?: DbReviewWinnerArt;
}

// ── Usage tracking ───────────────────────────────────────────────────
//
// Accumulates OpenAI token usage across all API calls within a single
// run, then prints a cost summary at the end.

interface UsageTracker {
  calls: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  falImageCount: number;
  falUpscaleCount: number;
  midjourneyJobCount: number;
  midjourneyUpscaleCount: number;
  model: SupportedLlmModel;
}

// Per-million-token pricing for supported models.
const MODEL_PRICING: Record<UsageTracker['model'], { input: number; cachedInput: number; output: number }> = {
  "gpt-5.2":      { input: 1.75,  cachedInput: 0.175, output: 14.0 },
  "gpt-5-mini":   { input: 0.25,  cachedInput: 0.025, output: 2.0 },
  "claude-sonnet-4-6": { input: 3.0, cachedInput: 0.3, output: 15.0 },
  "claude-opus-4-7": { input: 5.0, cachedInput: 0.5, output: 25.0 },
};

// Fal.ai per-request pricing (approximate).
const FAL_PRICING = {
  "flux-pro": 0.06,
  "esrgan": 0.005,
};

export function createUsageTracker(model: UsageTracker['model']): UsageTracker {
  return { calls: 0, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, reasoningTokens: 0, falImageCount: 0, falUpscaleCount: 0, midjourneyJobCount: 0, midjourneyUpscaleCount: 0, model };
}

function recordOpenAiUsage(tracker: UsageTracker, usage: { input_tokens: number; output_tokens: number; input_tokens_details?: { cached_tokens: number }; output_tokens_details?: { reasoning_tokens: number } } | undefined) {
  if (!usage) return;
  tracker.calls++;
  tracker.inputTokens += usage.input_tokens;
  tracker.outputTokens += usage.output_tokens;
  tracker.cachedInputTokens += usage.input_tokens_details?.cached_tokens ?? 0;
  tracker.reasoningTokens += usage.output_tokens_details?.reasoning_tokens ?? 0;
}

function recordAnthropicUsage(
  tracker: UsageTracker,
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number | null;
    cache_read_input_tokens?: number | null;
  } | undefined
) {
  if (!usage) return;
  tracker.calls++;
  const cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
  tracker.inputTokens += usage.input_tokens + cacheCreationTokens + cacheReadTokens;
  tracker.outputTokens += usage.output_tokens;
  tracker.cachedInputTokens += cacheReadTokens;
}

function getModelProvider(model: SupportedLlmModel): LlmProvider {
  return model.startsWith("claude-") ? "anthropic" : "openai";
}

function isOpenAiModel(model: SupportedLlmModel): model is OpenAiModel {
  return model === "gpt-5.2" || model === "gpt-5-mini";
}

async function getOpenAiClientOrThrow() {
  const openAiClient = await getOpenAI();
  if (!openAiClient) {
    throw new Error('Could not initialize OpenAI client!');
  }
  return openAiClient;
}

function printUsageSummary(tracker: UsageTracker) {
  const pricing = MODEL_PRICING[tracker.model];
  const uncachedInputTokens = tracker.inputTokens - tracker.cachedInputTokens;

  const inputCost = pricing
    ? ((uncachedInputTokens / 1_000_000) * pricing.input) + ((tracker.cachedInputTokens / 1_000_000) * pricing.cachedInput)
    : null;
  const outputCost = pricing
    ? (tracker.outputTokens / 1_000_000) * pricing.output
    : null;
  const falCost = (tracker.falImageCount * FAL_PRICING["flux-pro"]) + (tracker.falUpscaleCount * FAL_PRICING["esrgan"]);

  const DIM = "\x1b[2m";
  const BOLD = "\x1b[1m";
  const CYAN = "\x1b[36m";
  const RESET = "\x1b[0m";

  const imageProviderLine = IMAGE_PROVIDER === 'midjourney'
    ? `  Midjourney jobs:    ${tracker.midjourneyJobCount} imagine ${DIM}(${tracker.midjourneyJobCount * 4} images)${RESET}, ${tracker.midjourneyUpscaleCount} upscale`
    : `  Fal.ai images:      ${tracker.falImageCount} generated, ${tracker.falUpscaleCount} upscaled`;

  const costLines = IMAGE_PROVIDER === 'midjourney'
    ? ""
    : `
  Fal.ai total:       ${CYAN}$${falCost.toFixed(4)}${RESET} ${DIM}(${tracker.falImageCount} × $${FAL_PRICING["flux-pro"]} + ${tracker.falUpscaleCount} × $${FAL_PRICING["esrgan"]})${RESET}
  ${BOLD}Combined total:     ${CYAN}$${((inputCost ?? 0) + (outputCost ?? 0) + falCost).toFixed(4)}${RESET}`;

  const modelProvider = getModelProvider(tracker.model);

  // eslint-disable-next-line no-console
  console.log(`
${BOLD}── Usage Summary ──────────────────────────────────────────${RESET}
  Model:              ${tracker.model}
  Provider:           ${modelProvider}
  LLM calls:          ${tracker.calls}
  Input tokens:       ${tracker.inputTokens.toLocaleString()} ${tracker.cachedInputTokens > 0 ? `${DIM}(${tracker.cachedInputTokens.toLocaleString()} cached)${RESET}` : ""}
  Output tokens:      ${tracker.outputTokens.toLocaleString()} ${tracker.reasoningTokens > 0 ? `${DIM}(${tracker.reasoningTokens.toLocaleString()} reasoning)${RESET}` : ""}
${imageProviderLine}
${BOLD}── Cost Estimate ──────────────────────────────────────────${RESET}${
  pricing
    ? `
  LLM input:          ${CYAN}$${inputCost!.toFixed(4)}${RESET} ${tracker.cachedInputTokens > 0 ? `${DIM}(${uncachedInputTokens.toLocaleString()} uncached × $${pricing.input}/M + ${tracker.cachedInputTokens.toLocaleString()} cached × $${pricing.cachedInput}/M)${RESET}` : ""}
  LLM output:         ${CYAN}$${outputCost!.toFixed(4)}${RESET}
  LLM total:          ${CYAN}$${(inputCost! + outputCost!).toFixed(4)}${RESET}`
    : `
  ${DIM}(no pricing data for model "${tracker.model}")${RESET}`}${costLines}
${DIM}──────────────────────────────────────────────────────────${RESET}
`);
}

// ── LLM prompt generation ────────────────────────────────────────────
//
// Given an essay's title and content, asks an LLM for concrete visual
// illustration descriptions, then appends the watercolor style suffix.

function buildIllustrationPrompt(title: string, essay: string, promptsGenerated: number): string {
  return `I am creating cover art for essays that will be featured on LessWrong. For each piece of art, I want a clear description of a visual illustration that captures the essence of the essay.

The illustration description should be concrete and specific, and should be something that can be depicted in a single image. The description should be something that is both visually striking and that captures the essence of the essay in a way that is likely to be interesting. It should be 5 - 15 words long.

I want you to list ${promptsGenerated} visual illustration descriptions for the essay.

If the essay specifically mentions something you can easily visualize, use that as one of the illustrations. If the title of the essay lends itself to a clear visual illustration, include that.

The image should not contain any text. It should not have any writing. It should not refer to the content of written materials. It should not ask for symbols representing concepts, but instead ask for concrete images (it's fine if you intend them to represent something, but you should figure out the specific concrete images to represent that thing). Do not use "mazes", or "labryinth" or "neural net" or "gears" as your illustrations.

If the essay only really talks about learning, metalearning, or other abstract concepts, consider a wide variety of illustrations.

If the essay contains any particular images or visual illustrations, feel free to use those in the answers.

Here are some examples:

1. a sea of thousands of people, one of them zoomed in using a magnifying glass
2. a set of scales with a heap of gold on one side and a heart on the other
3. a tree with tangled roots and a single leaf
4. a person standing on a mountain peak looking out over a vast landscape
5. images from different time periods with a wanderer walking through them

Here are some bad examples:

1. A quill writing the word 'honor'
2. A pile of resources dwindling
3. A collection of books about Zen Buddhism
4. A labyrinth of forking paths
5. A interlocking mechanism of gears

Please generate ${promptsGenerated} visual illustrations for the essay that will appear on Lesswrong. The essay will appear after the "===".

Please go through the following steps in your reasoning before returning your final answer:

1. SUMMARY: What is the main idea of the essay?
2. IDEAS: A JSON list of ${promptsGenerated} visual illustrations, like ["a sea of thousands of people, one of them zoomed in using a magnifying glass", "a set of scales with a heap of gold on one side and a heart on the other", "a tree with tangled roots and a single leaf"]
3. CHECK: For each illustration, write out the illustration and answer (a) does the illustration contain writing or refer to the content of written materials or say that words should appear in the image? (yes/no) (b) Does the illustration ask for any symbols respresenting concepts? (yes/no) Is it 5 to 15 words long? (yes/no)
4. CORRECTIONS: If any of the illustrations contain writing or refer to the content of written materials, please provide a corrected version of the illustration.

Finally, 5. ILLUSTRATIONS: A JSON list of your final ${promptsGenerated} visual illustrations.

===

${title}

${essay}`;
}

function formatAsImagePrompt(illustrationDescription: string): string {
  const lowerCased = illustrationDescription[0].toLowerCase() + illustrationDescription.slice(1);
  return `${lowerCased}${artPrompt}`;
}

// Truncate long essay content to fit within LLM context limits.
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  const halfLength = Math.floor(maxLength / 2);
  return content.slice(0, halfLength) + "\n[EXCERPTED FOR LENGTH]\n" + content.slice(-halfLength);
}

const IllustrationsSchema = z.object({
  illustrations: z.array(z.string()),
});

async function getIllustrationDescriptionsOpenAi(
  essay: { title: string; content: string; promptsGenerated: number },
  tracker: UsageTracker,
  tryCount = 0
): Promise<string[]> {
  const { OpenAI } = await import("openai");
  const { zodTextFormat } = await import("openai/helpers/zod");
  const openAiClient = await getOpenAiClientOrThrow();

  const content = truncateContent(essay.content, 25_000);
  const response = await openAiClient.responses.parse({
    model: isOpenAiModel(tracker.model) ? tracker.model : "gpt-5.2",
    input: [{ role: "user", content: buildIllustrationPrompt(essay.title, content, essay.promptsGenerated) }],
    text: { format: zodTextFormat(IllustrationsSchema, "illustrations") },
    reasoning: {
      effort: 'low',
    },
  }).catch((error) => {
    if (error instanceof OpenAI.APIError && error.status === 400 && error.code === 'context_length_exceeded') {
      // Retry with more aggressive truncation
      const shorterContent = truncateContent(essay.content, 16_000);
      return openAiClient.responses.parse({
        model: isOpenAiModel(tracker.model) ? tracker.model : "gpt-5.2",
        input: [{ role: "user", content: buildIllustrationPrompt(essay.title, shorterContent, essay.promptsGenerated) }],
        text: { format: zodTextFormat(IllustrationsSchema, "illustrations") },
        reasoning: {
          effort: 'low',
        },
      });
    } else {
      // eslint-disable-next-line no-console
      console.error("Error from OpenAI:", error);
      return undefined;
    }
  });

  recordOpenAiUsage(tracker, response?.usage);

  try {
    return response?.output_parsed?.illustrations ?? [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing LLM response:', error);
    if (tryCount < 2) return getIllustrationDescriptionsOpenAi(essay, tracker, tryCount + 1);
    return [];
  }
}

async function getIllustrationDescriptionsAnthropic(
  essay: { title: string; content: string; promptsGenerated: number },
  tracker: UsageTracker,
): Promise<string[]> {
  const anthropicClient = getAnthropicClientOrThrow();
  const anthropicModel = getModelProvider(tracker.model) === "anthropic"
    ? tracker.model
    : "claude-sonnet-4-6";
  const content = truncateContent(essay.content, 25_000);
  const completion = await anthropicClient.messages.parse({
    model: anthropicModel,
    max_tokens: 1_200,
    messages: [{
      role: "user",
      content: buildIllustrationPrompt(essay.title, content, essay.promptsGenerated),
    }],
    output_config: {
      format: zodOutputFormat(IllustrationsSchema),
    },
  });

  recordAnthropicUsage(tracker, completion.usage);
  const parsed = completion.parsed_output?.illustrations ?? [];

  return parsed;
}

async function getIllustrationDescriptions(
  essay: { title: string; content: string; promptsGenerated: number },
  tracker: UsageTracker,
  tryCount = 0
): Promise<string[]> {
  const provider = getModelProvider(tracker.model);
  if (provider === "anthropic") {
    return getIllustrationDescriptionsAnthropic(essay, tracker);
  }
  return getIllustrationDescriptionsOpenAi(essay, tracker, tryCount);
}

async function getImagePrompts(
  essay: { title: string; content: string; promptsGenerated: number },
  tracker: UsageTracker
): Promise<string[]> {
  const descriptions = await getIllustrationDescriptions(essay, tracker);

  if (descriptions.length > 0) {
    const DIM = "\x1b[2m";
    const BOLD = "\x1b[1m";
    const RESET = "\x1b[0m";
    const numbered = descriptions.map((d, i) => `  ${DIM}${String(i + 1).padStart(2)}.${RESET} ${d}`).join("\n");
    // eslint-disable-next-line no-console
    console.log(`\n${BOLD}Illustrations for "${essay.title}":${RESET}\n${numbered}\n`);
  }

  const formatter = IMAGE_PROVIDER === 'midjourney' ? formatAsMidjourneyPrompt : formatAsImagePrompt;
  return descriptions.map(formatter);
}

// ── Image generation (Fal.ai) ────────────────────────────────────────
//
// Generates images using flux-pro with a reference style image, then
// upscales the result with esrgan.

// Reference style images that guide the watercolor/aquarelle aesthetic.
const referenceStyleImageUrls = [
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1705201417/ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_xvecay.png",
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1741915926/raemon777_httpss.mj.runvqNA-Ykxa4U_watercolor_--no_circle_--a_e526384c-ca72-42e3-b0f8-aae57e7f3ca0_3_zybtog.png",
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/a_270/v1741915926/raemon777_httpss.mj.runvqNA-Ykxa4U_watercolor_--no_circle_--a_e526384c-ca72-42e3-b0f8-aae57e7f3ca0_3_zybtog.png",
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/a_vflip/v1741915926/raemon777_httpss.mj.runvqNA-Ykxa4U_watercolor_--no_circle_--a_e526384c-ca72-42e3-b0f8-aae57e7f3ca0_3_zybtog.png",
];

// Lazily initialized Fal.ai client. Avoids calling setting.get() at import time.
const getFalClient = (() => {
  let fal: typeof _fal;
  return () => {
    if (!fal) {
      fal = _fal;
      fal.config({ credentials: () => falApiKey.get() });
    }
    return fal;
  };
})();

async function generateImage(prompt: string, referenceImageUrl: string, tracker: UsageTracker): Promise<string> {
  try {
    const result = await getFalClient().subscribe("fal-ai/flux-pro/v1.1-ultra/redux", {
      input: {
        prompt,
        image_url: referenceImageUrl,
        image_prompt_strength: .2,
        aspect_ratio: "1:1",
      }
    });
    tracker.falImageCount++;
    return result.data.images[0].url;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating image:', error, { prompt, referenceImageUrl });
    throw error;
  }
}

async function generateAndUpscaleImage(prompt: string, referenceImageUrl: string, tracker: UsageTracker): Promise<string> {
  const imageUrl = await generateImage(prompt, referenceImageUrl, tracker);

  try {
    const result = await getFalClient().subscribe("fal-ai/esrgan", {
      input: { image_url: imageUrl, scale: 1.35 }
    });
    tracker.falUpscaleCount++;
    // eslint-disable-next-line no-console
    console.log("Generated and upscaled:", prompt.split(artPrompt)[0]);
    return result.data.image.url;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error upscaling image, falling back to base resolution:', error);
    return imageUrl;
  }
}

// ── Image generation (Midjourney) ─────────────────────────────────────
//
// Uses Midjourney's internal web API via a browser bridge. A local HTTP
// server runs in the script process, and a small polling client injected
// into a Midjourney browser tab picks up pending jobs, submits them via
// same-origin fetch (bypassing Cloudflare), and posts results back.
// Each job produces 4 images (batch_size 4).

const MJ_CDN_BASE = "https://cdn.midjourney.com";
const MJ_USER_ID = process.env.MIDJOURNEY_USER_ID;
function getMjUserId(): string {
  if (!MJ_USER_ID) {
    throw new Error("MIDJOURNEY_USER_ID is not set");
  }
  return MJ_USER_ID;
}

function getMjChannelId(): string {
  return `singleplayer_${getMjUserId()}`;
}

const MJ_BRIDGE_PORT = 7878;

// Fixed prompt template. Only the illustration description varies.
const MJ_SREF_URLS = [
  "https://s.mj.run/nrq4yMva2vE",
  "https://s.mj.run/IGPQeOIfSLc",
  "https://s.mj.run/2HdrweCGGzo",
  "https://s.mj.run/jYu92ks5gQc",
];

function formatAsMidjourneyPrompt(illustrationDescription: string): string {
  const lowerCased = illustrationDescription[0].toLowerCase() + illustrationDescription.slice(1);
  const srefs = MJ_SREF_URLS.join(" ");
  return `LessWrong review winner art, ${lowerCased}, aquarelle painting fading to white by Thomas W. Schaller --no text --sref ${srefs} --profile wkbqykw --ar 2:1 --v 7`;
}

// ── Browser bridge ────────────────────────────────────────────────────
//
// The bridge lets the Node.js script submit Midjourney jobs through a
// real browser tab, avoiding Cloudflare's TLS fingerprinting.
//
// Flow:
//   1. Script starts a local HTTP server on MJ_BRIDGE_PORT
//   2. A JS client is injected into the Midjourney browser tab
//   3. When the script wants to submit a job, it queues it and waits
//   4. The browser client polls /pending, submits via same-origin fetch,
//      and POSTs the result back to /result
//   5. The script resolves the pending promise with the response

import http from "http";

interface PendingBridgeRequest {
  id: string;
  type: "submit" | "cdn-check" | "download" | "fetch-json";
  body?: object;
  url?: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

let mjBridgeServer: http.Server | null = null;
const bridgeQueue: PendingBridgeRequest[] = [];
const inFlightRequests = new Map<string, PendingBridgeRequest>();

export function startMidjourneyBridge(): Promise<void> {
  if (mjBridgeServer) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "https://www.midjourney.com");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === "GET" && req.url === "/pending") {
        const next = bridgeQueue.shift();
        if (next) {
          inFlightRequests.set(next.id, next);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            id: next.id,
            type: next.type,
            body: next.body,
            url: next.url,
          }));
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end("null");
        }
        return;
      }

      if (req.method === "POST" && req.url === "/result") {
        let data = "";
        req.on("data", (chunk: string) => { data += chunk; });
        req.on("end", () => {
          const result = JSON.parse(data) as { id: string; error?: string; response?: unknown };
          const pending = inFlightRequests.get(result.id);
          if (pending) {
            inFlightRequests.delete(result.id);
            if (result.error) {
              pending.reject(new Error(`Midjourney bridge error: ${result.error}`));
            } else {
              pending.resolve(result.response);
            }
          }
          res.writeHead(200);
          res.end("ok");
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.on("error", reject);
    server.listen(MJ_BRIDGE_PORT, () => {
      mjBridgeServer = server;
      // eslint-disable-next-line no-console
      console.log(`MJ bridge server listening on http://localhost:${MJ_BRIDGE_PORT}`);
      // eslint-disable-next-line no-console
      console.log("Inject the bridge client into your Midjourney browser tab (see console output).");
      resolve();
    });
  });
}

/** Returns the JS snippet to paste/inject into the browser console. */
export function getMjBridgeClientScript(): string {
  return `(async function mjBridge() {
  const BRIDGE = 'http://localhost:${MJ_BRIDGE_PORT}';
  const POLL_MS = 500;
  console.log('[MJ Bridge] Client started, polling for requests...');
  while (true) {
    try {
      const res = await fetch(BRIDGE + '/pending');
      const pending = await res.json();
      if (pending) {
        console.log('[MJ Bridge] Got request:', pending.type, pending.id);
        try {
          let response;
          if (pending.type === 'submit') {
            const resp = await fetch('/api/submit-jobs', {
              method: 'POST',
              headers: { 'content-type': 'application/json', 'x-csrf-protection': '1' },
              body: JSON.stringify(pending.body),
            });
            response = await resp.json();
            console.log('[MJ Bridge] Job submitted:', response);
          } else if (pending.type === 'cdn-check') {
            const resp = await fetch(pending.url, { method: 'HEAD', cache: 'no-store' });
            response = { ok: resp.ok, status: resp.status };
            console.log('[MJ Bridge] CDN check:', pending.url, resp.status);
          } else if (pending.type === 'download') {
            const resp = await fetch(pending.url, { cache: 'no-store' });
            if (!resp.ok) throw new Error('Download failed: ' + resp.status);
            const blob = await resp.blob();
            const reader = new FileReader();
            const dataUrl = await new Promise(function(resolve) {
              reader.onloadend = function() { resolve(reader.result); };
              reader.readAsDataURL(blob);
            });
            response = { dataUrl };
            console.log('[MJ Bridge] Downloaded:', pending.url, blob.size, 'bytes');
          } else if (pending.type === 'fetch-json') {
            const resp = await fetch(pending.url, {
              headers: { 'x-csrf-protection': '1' },
              cache: 'no-store',
            });
            if (!resp.ok) throw new Error('Fetch failed: ' + resp.status);
            response = await resp.json();
            console.log('[MJ Bridge] Fetched JSON:', pending.url);
          }
          await fetch(BRIDGE + '/result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pending.id, response }),
          });
        } catch (e) {
          await fetch(BRIDGE + '/result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pending.id, error: e.message }),
          });
        }
      }
    } catch (e) { /* bridge not ready, retry */ }
    await new Promise(r => setTimeout(r, POLL_MS));
  }
})();`;
}

interface MidjourneySubmitResponse {
  success: Array<{
    job_id: string;
    prompt: string;
    is_queued: boolean;
    event_type: string;
    meta: { height: number; width: number; batch_size: number };
  }>;
  failure: Array<{ job_id?: string }>;
}

async function submitMidjourneyJob(prompt: string): Promise<MidjourneySubmitResponse> {
  await startMidjourneyBridge();

  const body = {
    f: { mode: "fast", private: false },
    channelId: getMjChannelId(),
    roomId: null,
    metadata: {
      isMobile: null,
      imagePrompts: 0,
      imageReferences: MJ_SREF_URLS.length,
      characterReferences: 0,
      depthReferences: 0,
      lightboxOpen: null,
    },
    t: "imagine",
    prompt,
  };

  const id = Math.random().toString(36).slice(2);

  return new Promise<MidjourneySubmitResponse>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Midjourney bridge timed out waiting for browser to pick up job. Is the bridge client running in the browser?"));
    }, 60_000);

    bridgeQueue.push({
      id,
      type: "submit",
      body,
      resolve: (value) => { clearTimeout(timeout); resolve(value as MidjourneySubmitResponse); },
      reject: (error) => { clearTimeout(timeout); reject(error); },
    });
  });
}

function checkCdnViaBridge(url: string): Promise<{ ok: boolean; status: number }> {
  const id = Math.random().toString(36).slice(2);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("CDN check timed out waiting for browser bridge"));
    }, 30_000);

    bridgeQueue.push({
      id,
      type: "cdn-check",
      url,
      resolve: (value) => { clearTimeout(timeout); resolve(value as { ok: boolean; status: number }); },
      reject: (error) => { clearTimeout(timeout); reject(error); },
    });
  });
}

export function downloadViaBridge(url: string): Promise<string> {
  const id = Math.random().toString(36).slice(2);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Download timed out waiting for browser bridge"));
    }, 60_000);

    bridgeQueue.push({
      id,
      type: "download",
      url,
      resolve: (value) => { clearTimeout(timeout); resolve((value as { dataUrl: string }).dataUrl); },
      reject: (error) => { clearTimeout(timeout); reject(error); },
    });
  });
}

function fetchJsonViaBridge(url: string): Promise<unknown> {
  const id = Math.random().toString(36).slice(2);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("JSON fetch timed out waiting for browser bridge"));
    }, 30_000);

    bridgeQueue.push({
      id,
      type: "fetch-json",
      url,
      resolve: (value) => { clearTimeout(timeout); resolve(value); },
      reject: (error) => { clearTimeout(timeout); reject(error); },
    });
  });
}

/**
 * Wait for a Midjourney job to complete by long-polling the /api/imagine-update
 * endpoint, then collect CDN image URLs. This avoids polling the CDN directly
 * (which can poison a 4-hour negative cache if we check too early).
 */
async function pollMidjourneyCompletion(
  jobId: string,
  batchSize: number,
  _initialDelayMs = 35_000,
  _pollIntervalMs = 5_000,
  timeoutMs = 300_000
): Promise<string[]> {
  // Step 1: Get a checkpoint from the /api/imagine endpoint, then long-poll
  // /api/imagine-update until our job appears in the response.
  // eslint-disable-next-line no-console
  console.log(`Waiting for job ${jobId} to complete via API polling...`);

  const startTime = Date.now();

  // Get the current checkpoint
  const initialResp = await fetchJsonViaBridge(
    `/api/imagine?user_id=${getMjUserId()}&page_size=1`
  ) as { data: Array<{ id: string }>; checkpoint: string };

  // Check if the job is already in the initial response
  if (initialResp.data.some(j => j.id === jobId)) {
    // eslint-disable-next-line no-console
    console.log(`Job ${jobId} already complete in initial fetch`);
  } else {
    let checkpoint = initialResp.checkpoint;

    while (Date.now() - startTime < timeoutMs) {
      try {
        const updateResp = await fetchJsonViaBridge(
          `/api/imagine-update?user_id=${getMjUserId()}&page_size=1000&checkpoint=${encodeURIComponent(checkpoint)}`
        ) as { data: Array<{ id: string }>; checkpoint: string };

        if (updateResp.checkpoint) {
          checkpoint = updateResp.checkpoint;
        }

        if (updateResp.data?.some(j => j.id === jobId)) {
          // eslint-disable-next-line no-console
          console.log(`Job ${jobId} confirmed complete via API`);
          break;
        }
      } catch {
        // Bridge error, will retry
      }

      await new Promise((resolve) => setTimeout(resolve, 3_000));
    }

    if (Date.now() - startTime >= timeoutMs) {
      throw new Error(`Midjourney job ${jobId} timed out after ${timeoutMs / 1000}s`);
    }
  }

  // Step 2: Job is confirmed complete. Wait a bit for CDN transcoding,
  // then collect URLs. Since the job is done, images should appear quickly.
  // eslint-disable-next-line no-console
  console.log("Job complete, waiting 5s for CDN transcoding...");
  await new Promise((resolve) => setTimeout(resolve, 5_000));

  const IMAGE_FORMATS = ["png", "webp", "jpeg"];
  const urls: string[] = [];
  for (let i = 0; i < batchSize; i++) {
    let found = false;
    for (const ext of IMAGE_FORMATS) {
      const url = `${MJ_CDN_BASE}/${jobId}/0_${i}.${ext}`;
      const check = await checkCdnViaBridge(url);
      if (check.ok) {
        urls.push(url);
        found = true;
        break;
      }
    }
    if (!found) {
      // eslint-disable-next-line no-console
      console.warn(`Image ${i} not available in any format for job ${jobId}, skipping`);
    }
  }
  return urls;
}

// ── Midjourney upscale ────────────────────────────────────────────────
//
// After a batch of 4 images is generated, each one can be upscaled to 2x
// resolution using Midjourney's upscale endpoint. This uses the same
// submit-jobs API with t="upscale" and the parent job ID + grid index.

const MJ_UPSCALE_TYPE: 'v7_2x_subtle' | 'v7_2x_creative' = 'v7_2x_creative';

async function submitMidjourneyUpscale(parentJobId: string, index: number): Promise<MidjourneySubmitResponse> {
  await startMidjourneyBridge();

  const body = {
    f: { mode: "fast", private: false },
    channelId: getMjChannelId(),
    roomId: null,
    metadata: {
      isMobile: null,
      imagePrompts: null,
      imageReferences: null,
      characterReferences: null,
      depthReferences: null,
      lightboxOpen: null,
    },
    t: "upscale",
    type: MJ_UPSCALE_TYPE,
    id: parentJobId,
    index,
  };

  const id = Math.random().toString(36).slice(2);

  return new Promise<MidjourneySubmitResponse>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Midjourney bridge timed out waiting for browser to pick up upscale job. Is the bridge client running in the browser?"));
    }, 60_000);

    bridgeQueue.push({
      id,
      type: "submit",
      body,
      resolve: (value) => { clearTimeout(timeout); resolve(value as MidjourneySubmitResponse); },
      reject: (error) => { clearTimeout(timeout); reject(error); },
    });
  });
}

export async function upscaleMidjourneyImage(parentJobId: string, index: number, tracker: UsageTracker): Promise<string> {
  const result = await submitMidjourneyUpscale(parentJobId, index);

  if (result.failure.length > 0) {
    // eslint-disable-next-line no-console
    console.error("Midjourney upscale failures:", result.failure);
  }
  if (result.success.length === 0) {
    throw new Error(`Midjourney upscale returned no successful jobs for parent ${parentJobId} index ${index}`);
  }

  const job = result.success[0];
  tracker.midjourneyUpscaleCount++;

  // eslint-disable-next-line no-console
  console.log(`Submitted MJ upscale job ${job.job_id} for parent ${parentJobId}[${index}], polling...`);

  // Upscale jobs produce a single image (batch_size 1). They tend to be
  // faster than initial generation, so use a shorter initial delay.
  const imageUrls = await pollMidjourneyCompletion(job.job_id, job.meta.batch_size, 20_000);

  // eslint-disable-next-line no-console
  console.log(`MJ upscale job ${job.job_id} complete`);

  return imageUrls[0];
}

// ── Persistence ──────────────────────────────────────────────────────
//
// Uploads a generated image to Cloudinary and creates the corresponding
// ReviewWinnerArt and default SplashArtCoordinate records.

const DEFAULT_SPLASH_COORDINATES = {
  leftXPct: 0,    leftYPct: 0,    leftWidthPct: .33,    leftHeightPct: 1,    leftFlipped: false,
  middleXPct: .33, middleYPct: 0, middleWidthPct: .33, middleHeightPct: 1, middleFlipped: false,
  rightXPct: .66,  rightYPct: 0,  rightWidthPct: .33,  rightHeightPct: 1,  rightFlipped: false,
} as const;

/** Parse a Midjourney CDN URL to extract the job ID and image index. */
export function parseMidjourneyUrl(url: string): { jobId: string; imageIndex: number } | null {
  // Format: https://cdn.midjourney.com/{jobId}/0_{index}.{ext}
  // or:     https://cdn.midjourney.com/{jobId}/0_{index}_640_N.webp
  const match = url.match(/cdn\.midjourney\.com\/([a-f0-9-]+)\/0_(\d+)/);
  if (!match) return null;
  return { jobId: match[1], imageIndex: parseInt(match[2]) };
}

interface SaveImageOptions {
  prompt: string;
  essay: Essay;
  url: string;
  midjourneyJobId?: string;
  midjourneyImageIndex?: number;
}

async function saveImageAsReviewWinnerArt({ prompt, essay, url, midjourneyJobId, midjourneyImageIndex }: SaveImageOptions) {
  const shortPrompt = prompt.trim().replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32);
  const shortTitle = essay.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32);
  const originId = encodeURIComponent(`${shortTitle}_${shortPrompt}_${Math.random()}`);

  // For Midjourney, download the image through the browser bridge first,
  // since Cloudinary's server can't fetch MJ CDN URLs (Cloudflare blocks them).
  // Pass the original CDN URL as the identifier so it's preserved in the Images table.
  let cloudinaryUrl: string | null;
  if (IMAGE_PROVIDER === 'midjourney') {
    // eslint-disable-next-line no-console
    console.log(`Downloading ${url} via browser bridge...`);
    const imageData = await downloadViaBridge(url);
    cloudinaryUrl = await moveImageToCloudinary({oldUrl: url, originDocumentId: originId, imageData});
  } else {
    cloudinaryUrl = await moveImageToCloudinary({oldUrl: url, originDocumentId: originId});
  }

  if (!cloudinaryUrl) {
    // eslint-disable-next-line no-console
    console.error("Failed to upload image to Cloudinary", {prompt, postId: essay.postId});
    return;
  }

  // If MJ metadata wasn't passed explicitly, try to parse it from the URL
  if (!midjourneyJobId && IMAGE_PROVIDER === 'midjourney') {
    const parsed = parseMidjourneyUrl(url);
    if (parsed) {
      midjourneyJobId = parsed.jobId;
      midjourneyImageIndex = parsed.imageIndex;
    }
  }

  const reviewWinnerArt = await createReviewWinnerArt({
    data: {
      postId: essay.postId,
      splashArtImagePrompt: prompt,
      splashArtImageUrl: cloudinaryUrl,
      ...(midjourneyJobId != null ? { midjourneyJobId } : {}),
      ...(midjourneyImageIndex != null ? { midjourneyImageIndex } : {}),
    }
  }, createAdminContext());

  if (reviewWinnerArt) {
    await createSplashArtCoordinate({
      data: { reviewWinnerArtId: reviewWinnerArt._id, ...DEFAULT_SPLASH_COORDINATES }
    }, createAdminContext());
  }

  return reviewWinnerArt;
}

// ── Orchestration ────────────────────────────────────────────────────

async function getArtForEssayFal(essay: Essay, prompts: string[], tracker: UsageTracker): Promise<EssayResult[]> {
  // Distribute neededArtCount evenly across prompts
  const imagesPerPrompt = Math.max(1, Math.floor(essay.neededArtCount / prompts.length));
  const allPrompts = prompts.flatMap(p => Array(imagesPerPrompt).fill(p));

  return Promise.all(allPrompts.map(async (currentPrompt) => {
    const image = await generateAndUpscaleImage(currentPrompt, sample(referenceStyleImageUrls)!, tracker);
    const reviewWinnerArt = await saveImageAsReviewWinnerArt({ prompt: currentPrompt, essay, url: image });
    return { title: essay.title, prompt: currentPrompt, imageUrl: image, reviewWinnerArt };
  }));
}

async function getArtForEssayMidjourney(essay: Essay, prompts: string[], tracker: UsageTracker): Promise<EssayResult[]> {
  // Each MJ job produces 4 images. Submit all jobs roughly in parallel,
  // staggered ~5s apart with jitter to avoid rate limits.
  const jobPromises = prompts.map(async (currentPrompt, index) => {
    if (index > 0) {
      const jitter = Math.random() * 3_000;
      await new Promise((resolve) => setTimeout(resolve, (5_000 * index) + jitter));
    }

    const result = await submitMidjourneyJob(currentPrompt);
    if (result.failure.length > 0) {
      // eslint-disable-next-line no-console
      console.error("Midjourney job failures:", result.failure);
    }
    if (result.success.length === 0) {
      throw new Error("Midjourney returned no successful jobs");
    }

    const job = result.success[0];
    tracker.midjourneyJobCount++;
    // eslint-disable-next-line no-console
    console.log(`Submitted MJ job ${job.job_id} (queued: ${job.is_queued}), polling for completion...`);

    const imageUrls = await pollMidjourneyCompletion(job.job_id, job.meta.batch_size);
    // eslint-disable-next-line no-console
    console.log(`MJ job ${job.job_id} complete: ${imageUrls.length} images`);

    // Save each of the 4 grid images as a separate ReviewWinnerArt
    const reviewWinnerArtResults = await Promise.all(
      imageUrls.map(async (imageUrl) => {
        const reviewWinnerArt = await saveImageAsReviewWinnerArt({ prompt: currentPrompt, essay, url: imageUrl });
        return { title: essay.title, prompt: currentPrompt, imageUrl, reviewWinnerArt };
      })
    );
    return reviewWinnerArtResults;
  });

  const nestedResults = await Promise.all(jobPromises);
  return nestedResults.flat();
}

async function getArtForEssay(essay: Essay, tracker: UsageTracker, prompt?: string): Promise<EssayResult[]> {
  const prompts = prompt
    ? [IMAGE_PROVIDER === 'midjourney' ? formatAsMidjourneyPrompt(prompt) : prompt]
    : await getImagePrompts(essay, tracker);

  if (IMAGE_PROVIDER === 'midjourney') {
    return getArtForEssayMidjourney(essay, prompts, tracker);
  }
  return getArtForEssayFal(essay, prompts, tracker);
}

// ── Entry points ─────────────────────────────────────────────────────

/**
 * Bulk generation: finds review winner posts that need more art and generates
 * images for up to 10 of them per run. Run this multiple times to cover all
 * winners.
 */
export const getReviewWinnerArts = async () => {
  const TARGET_ART_PER_POST = 50;

  // eslint-disable-next-line no-console
  console.time('getReviewWinnerArts');

  const reviewWinnerPosts = await ReviewWinners.find(
    { reviewYear: REVIEW_YEAR },
    { projection: { postId: 1 }, sort: { reviewRanking: 1 } }
  ).fetch();

  const allExistingArt = await ReviewWinnerArts.find({}).fetch();

  const postsNeedingArt = reviewWinnerPosts
    .filter(rw => allExistingArt.filter(a => a.postId === rw.postId).length < (TARGET_ART_PER_POST * .9));

  const { data } = await runQuery(postsWithMarkdownQuery, {
    input: { terms: { postIds: postsNeedingArt.map(p => p.postId) } }
  });
  const posts = data?.posts?.results?.filter((p): p is NonNullable<typeof p> => !!p) ?? [];

  const essays: Essay[] = posts.map(post => {
    const existingCount = allExistingArt.filter(a => a.postId === post._id).length;
    return {
      postId: post._id,
      title: post.title,
      content: post.contents?.markdown ?? "",
      neededArtCount: Math.max(0, TARGET_ART_PER_POST - existingCount),
      promptsGenerated: 10
    };
  });

  // Process in batches of 10 to avoid overwhelming external APIs
  const batch = essays.slice(0, 10);

  // eslint-disable-next-line no-console
  console.log(`Generating art for ${batch.length} essays (${essays.length} total need art)`);

  if (IMAGE_PROVIDER === 'midjourney') {
    await startMidjourneyBridge();
    // eslint-disable-next-line no-console
    console.log("\n=== Paste this into your Midjourney browser tab console: ===\n");
    // eslint-disable-next-line no-console
    console.log(getMjBridgeClientScript());
    // eslint-disable-next-line no-console
    console.log("\n=============================================================\n");
  }

  const tracker = createUsageTracker(DEFAULT_ILLUSTRATION_MODEL);
  const results = await Promise.all(batch.map(essay => getArtForEssay(essay, tracker)));
  const totalImages = results.reduce((sum, r) => sum + r.length, 0);

  // eslint-disable-next-line no-console
  console.log(`\nGenerated ${totalImages} images for ${results.length} essays`);
  // eslint-disable-next-line no-console
  console.timeEnd('getReviewWinnerArts');
  printUsageSummary(tracker);
};

/**
 * Single-post generation: creates a small batch of images for one post.
 * Called from the /bestoflesswrongadmin page via the generateCoverImagesForPost
 * GraphQL mutation, or directly via repl.
 */
export const generateCoverImagesForPost = async (postId: string, prompt?: string): Promise<EssayResult[]> => {
  // eslint-disable-next-line no-console
  console.time('generateCoverImagesForPost');

  const { data } = await runQuery(postWithMarkdownQuery, {
    input: { selector: { documentId: postId } }
  });
  const post = data?.post?.result;

  if (!post) {
    throw new Error(`Post with ID ${postId} not found`);
  }

  const essay: Essay = {
    postId: post._id,
    title: post.title,
    content: post.contents?.markdown ?? "",
    promptsGenerated: 3,
    neededArtCount: 9
  };

  if (IMAGE_PROVIDER === 'midjourney') {
    await startMidjourneyBridge();
    // eslint-disable-next-line no-console
    console.log("\n=== Paste this into your Midjourney browser tab console: ===\n");
    // eslint-disable-next-line no-console
    console.log(getMjBridgeClientScript());
    // eslint-disable-next-line no-console
    console.log("\n=============================================================\n");
  }

  const tracker = createUsageTracker(DEFAULT_ILLUSTRATION_MODEL);
  const results = await getArtForEssay(essay, tracker, prompt);

  // eslint-disable-next-line no-console
  console.timeEnd('generateCoverImagesForPost');
  printUsageSummary(tracker);

  return results;
};

/**
 * Preview illustration prompts for a post without generating any images.
 * Useful for iterating on prompt quality before spending on image generation.
 */
export const previewIllustrations = async (postId: string, count = 3): Promise<string[]> => {
  const { data } = await runQuery(postWithMarkdownQuery, {
    input: { selector: { documentId: postId } }
  });
  const post = data?.post?.result;

  if (!post) {
    throw new Error(`Post with ID ${postId} not found`);
  }

  const tracker = createUsageTracker(DEFAULT_ILLUSTRATION_MODEL);
  const prompts = await getImagePrompts({ title: post.title, content: post.contents?.markdown ?? "", promptsGenerated: count }, tracker);

  printUsageSummary(tracker);

  return prompts;
};

// ── Scrape MJ jobs ───────────────────────────────────────────────────
//
// Fetches job metadata from Midjourney's /api/imagine endpoint via the
// browser bridge. Paginates through all jobs between topJobId and
// bottomJobId (inclusive), filtering for "imagine" jobs (not upscales).
//
// Usage via repl:
//   yarn repl prod packages/lesswrong/server/scripts/generativeModels/coverImageGeneration.ts 'scrapeMidjourneyJobs("top-job-id", "bottom-job-id")'

interface MjApiJob {
  id: string;
  full_command: string;
  batch_size: number;
  parent_id: string | null;
  parent_grid: number | null;
  event_type: string;
  enqueue_time: string;
}

interface MjApiResponse {
  data: MjApiJob[];
  cursor: string;
}

/**
 * Scrapes all MJ jobs between topJobId (newest) and bottomJobId (oldest),
 * inclusive. Returns only "imagine" jobs (no upscales/variations).
 */
export async function scrapeMidjourneyJobs(topJobId: string, bottomJobId: string): Promise<MjJobInfo[]> {
  await startMidjourneyBridge();
  // eslint-disable-next-line no-console
  console.log("\n=== Paste this into your Midjourney browser tab console: ===\n");
  // eslint-disable-next-line no-console
  console.log(getMjBridgeClientScript());
  // eslint-disable-next-line no-console
  console.log("\n=============================================================\n");

  const PAGE_SIZE = 1000;
  const allJobs: MjApiJob[] = [];
  let cursor: string | null = null;
  let foundTop = false;
  let foundBottom = false;

  // eslint-disable-next-line no-console
  console.log(`Scraping MJ jobs from ${topJobId} to ${bottomJobId}...`);

  while (!foundBottom) {
    const url = cursor
      ? `/api/imagine?user_id=${getMjUserId()}&page_size=${PAGE_SIZE}&cursor=${encodeURIComponent(cursor)}`
      : `/api/imagine?user_id=${getMjUserId()}&page_size=${PAGE_SIZE}`;

    const response = await fetchJsonViaBridge(url) as MjApiResponse;
    const jobs = response.data;

    if (!jobs || jobs.length === 0) {
      // eslint-disable-next-line no-console
      console.warn("No more jobs returned from API, stopping pagination");
      break;
    }

    for (const job of jobs) {
      if (job.id === topJobId) {
        foundTop = true;
      }
      if (foundTop) {
        allJobs.push(job);
      }
      if (job.id === bottomJobId) {
        foundBottom = true;
        break;
      }
    }

    if (!foundBottom) {
      if (!response.cursor) {
        // eslint-disable-next-line no-console
        console.warn("No cursor in response, stopping pagination");
        break;
      }
      cursor = response.cursor;
      // eslint-disable-next-line no-console
      console.log(`  Fetched ${jobs.length} jobs (${allJobs.length} in range so far), paginating...`);
    }
  }

  if (!foundTop) {
    // eslint-disable-next-line no-console
    console.warn(`Warning: top job ID ${topJobId} was not found in the scraped jobs`);
  }
  if (!foundBottom) {
    // eslint-disable-next-line no-console
    console.warn(`Warning: bottom job ID ${bottomJobId} was not found in the scraped jobs`);
  }

  // Filter to only "imagine" jobs (exclude upscales, variations, etc.)
  const imagineJobs = allJobs.filter(j => j.parent_id === null && j.event_type === 'diffusion');

  const result: MjJobInfo[] = imagineJobs.map(j => ({
    jobId: j.id,
    prompt: j.full_command,
    batchSize: j.batch_size,
  }));

  // eslint-disable-next-line no-console
  console.log(`\nScraped ${allJobs.length} total jobs, ${result.length} are imagine jobs (no upscales/variations)`);

  await writeFile('mj-jobs.json', JSON.stringify(result, null, 2));

  return result;
}

// ── Backfill MJ metadata ─────────────────────────────────────────────
//
// For existing ReviewWinnerArt records that were created before we started
// storing Midjourney metadata, this function recovers the job ID and image
// index by matching images. It takes a list of MJ jobs (scraped from the
// MJ website) and matches them to existing records by prompt + image comparison.
//
// Usage via repl:
//   yarn repl prod packages/lesswrong/server/scripts/generativeModels/coverImageGeneration.ts 'backfillMidjourneyMetadata(await scrapeMidjourneyJobs("top-id", "bottom-id"))'

interface MjJobInfo {
  jobId: string;
  prompt: string;
  batchSize: number;
}

const MATCH_SIZE = 64;
const BRIDGE_CONCURRENCY = 8;
const CLOUDINARY_CONCURRENCY = 10;

interface PixelBuffer {
  jobId: string;
  index: number;
  pixels: Buffer;
}

async function downloadMjThumbnail(img: { jobId: string; index: number; url: string }): Promise<PixelBuffer | null> {
  try {
    const dataUrl = await downloadViaBridge(img.url);
    const { buffer } = parseDataUri(dataUrl);
    const pixels = await sharp(buffer).resize(MATCH_SIZE, MATCH_SIZE).raw().toBuffer();
    return { jobId: img.jobId, index: img.index, pixels };
  } catch {
    // eslint-disable-next-line no-console
    console.warn(`Failed to download MJ thumbnail: ${img.url}`);
    return null;
  }
}

async function downloadCloudinaryThumbnail(art: DbReviewWinnerArt): Promise<{ artId: string; pixels: Buffer } | null> {
  try {
    const cloudinarySmall = art.splashArtImageUrl.includes('cloudinary.com')
      ? art.splashArtImageUrl.replace('/upload/', '/upload/w_128/')
      : art.splashArtImageUrl;

    const resp = await fetch(cloudinarySmall);
    if (!resp.ok) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to fetch Cloudinary image for art ${art._id}`);
      return null;
    }
    const artBuffer = Buffer.from(await resp.arrayBuffer());
    const pixels = await sharp(artBuffer).resize(MATCH_SIZE, MATCH_SIZE).raw().toBuffer();
    return { artId: art._id, pixels };
  } catch {
    // eslint-disable-next-line no-console
    console.warn(`Error downloading Cloudinary image for art ${art._id}`);
    return null;
  }
}

function findBestMseMatch(artPixels: Buffer, candidates: PixelBuffer[]): { jobId: string; index: number; mse: number } | null {
  let bestMatch: { jobId: string; index: number; mse: number } | null = null;
  for (const mj of candidates) {
    let sumSq = 0;
    for (let i = 0; i < artPixels.length; i++) {
      const diff = artPixels[i] - mj.pixels[i];
      sumSq += diff * diff;
    }
    const mse = sumSq / artPixels.length;
    if (!bestMatch || mse < bestMatch.mse) {
      bestMatch = { jobId: mj.jobId, index: mj.index, mse };
    }
  }
  return bestMatch;
}

export async function backfillMidjourneyMetadata() {
  const mjJobs = JSON.parse(await readFile('mj-jobs.json', 'utf8')) as MjJobInfo[];

  // Fetch all ReviewWinnerArt records without MJ metadata
  const allArts = await ReviewWinnerArts.find({
    midjourneyJobId: null,
  }).fetch();

  // eslint-disable-next-line no-console
  console.log(`Found ${allArts.length} ReviewWinnerArt records without MJ metadata`);

  // Strip MJ parameters (--no, --sref, --ar, --v, --profile, etc.) from
  // a prompt to get just the illustration description. MJ's API normalizes
  // parameters (e.g. "--v 7" becomes "--v 7.0") so we can't match on them.
  const stripMjParams = (prompt: string) => prompt.replace(/\s+--\S+(\s+\S+)*/g, '').trim();

  // Group arts by normalized prompt
  const artsByPrompt = new Map<string, DbReviewWinnerArt[]>();
  for (const art of allArts) {
    const key = stripMjParams(art.splashArtImagePrompt);
    const existing = artsByPrompt.get(key) ?? [];
    existing.push(art);
    artsByPrompt.set(key, existing);
  }

  // Group MJ jobs by normalized prompt
  const jobsByPrompt = new Map<string, MjJobInfo[]>();
  for (const job of mjJobs) {
    const key = stripMjParams(job.prompt);
    const existing = jobsByPrompt.get(key) ?? [];
    existing.push(job);
    jobsByPrompt.set(key, existing);
  }

  await startMidjourneyBridge();
  // eslint-disable-next-line no-console
  console.log("\n=== Paste this into your Midjourney browser tab console: ===\n");
  // eslint-disable-next-line no-console
  console.log(getMjBridgeClientScript());
  // eslint-disable-next-line no-console
  console.log("\n=============================================================\n");

  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const [prompt, arts] of artsByPrompt) {
    const jobs = jobsByPrompt.get(prompt);
    if (!jobs) {
      // eslint-disable-next-line no-console
      console.warn(`No MJ jobs found for prompt: ${prompt.slice(0, 60)}...`);
      unmatchedCount += arts.length;
      continue;
    }

    // Build list of CDN thumbnail URLs for all images in this prompt group
    const jobImages: Array<{ jobId: string; index: number; url: string }> = [];
    for (const job of jobs) {
      for (let i = 0; i < job.batchSize; i++) {
        jobImages.push({
          jobId: job.jobId,
          index: i,
          url: `${MJ_CDN_BASE}/${job.jobId}/0_${i}_640_N.webp`,
        });
      }
    }

    // Download MJ thumbnails in parallel via bridge
    const mjResults = await executePromiseQueue(
      jobImages.map((img) => () => downloadMjThumbnail(img)),
      BRIDGE_CONCURRENCY
    );
    const mjPixelBuffers = mjResults.filter((r): r is PixelBuffer => r !== null);

    // Download Cloudinary thumbnails in parallel (server-side fetch)
    const cloudinaryResults = await executePromiseQueue(
      arts.map((art) => () => downloadCloudinaryThumbnail(art)),
      CLOUDINARY_CONCURRENCY
    );

    // Build a map from artId -> pixels for successful downloads
    const artPixelsMap = new Map<string, Buffer>();
    for (const result of cloudinaryResults) {
      if (result) {
        artPixelsMap.set(result.artId, result.pixels);
      }
    }

    // Greedy matching with removal: match each art to the best MJ candidate,
    // then remove that candidate so it can't be reused
    const remainingCandidates = [...mjPixelBuffers];
    const pendingUpdates: Array<{ artId: string; jobId: string; imageIndex: number }> = [];

    for (const art of arts) {
      const artPixels = artPixelsMap.get(art._id);
      if (!artPixels) {
        unmatchedCount++;
        continue;
      }

      const bestMatch = findBestMseMatch(artPixels, remainingCandidates);

      if (bestMatch && bestMatch.mse < 500) {
        // Remove matched candidate from pool
        const matchIdx = remainingCandidates.findIndex(
          (c) => c.jobId === bestMatch.jobId && c.index === bestMatch.index
        );
        if (matchIdx !== -1) {
          remainingCandidates.splice(matchIdx, 1);
        }

        pendingUpdates.push({ artId: art._id, jobId: bestMatch.jobId, imageIndex: bestMatch.index });
        matchedCount++;
        // eslint-disable-next-line no-console
        console.log(`Matched art ${art._id} -> job ${bestMatch.jobId}[${bestMatch.index}] (MSE: ${bestMatch.mse.toFixed(1)})`);
      } else {
        unmatchedCount++;
        // eslint-disable-next-line no-console
        console.warn(`No good match for art ${art._id} (best MSE: ${bestMatch?.mse.toFixed(1) ?? 'N/A'})`);
      }
    }

    // Write all DB updates for this prompt group in parallel
    await executePromiseQueue(
      pendingUpdates.map((u) => () =>
        ReviewWinnerArts.rawUpdateOne(
          { _id: u.artId },
          { $set: { midjourneyJobId: u.jobId, midjourneyImageIndex: u.imageIndex } }
        )
      ),
      10
    );
  }

  // eslint-disable-next-line no-console
  console.log(`\nBackfill complete: ${matchedCount} matched, ${unmatchedCount} unmatched`);
}

function parseDataUri(dataUri: string): { mimeType: string; buffer: Buffer } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URI');
  return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
}

