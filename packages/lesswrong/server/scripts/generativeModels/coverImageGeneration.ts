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

// eslint-disable-next-line no-restricted-imports
import type OpenAI from 'openai';
import { z } from "zod";
import { getOpenAI } from '../../languageModels/languageModelIntegration';
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

// ── Configuration ────────────────────────────────────────────────────

// Which image generation provider to use.
const IMAGE_PROVIDER: 'fal' | 'midjourney' = 'midjourney';

// The OpenAI model to use for generating illustration descriptions.
// Change this to experiment with different models (e.g. "gpt-5-mini").
const OPENAI_MODEL = "gpt-5.2";

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
  model: 'gpt-5.2' | 'gpt-5-mini';
}

// Per-million-token pricing for supported models.
const MODEL_PRICING: Record<UsageTracker['model'], { input: number; cachedInput: number; output: number }> = {
  "gpt-5.2":      { input: 1.75,  cachedInput: 0.175, output: 14.0 },
  "gpt-5-mini":   { input: 0.25,  cachedInput: 0.025, output: 2.0 },
};

// Fal.ai per-request pricing (approximate).
const FAL_PRICING = {
  "flux-pro": 0.06,
  "esrgan": 0.005,
};

function createUsageTracker(model: UsageTracker['model']): UsageTracker {
  return { calls: 0, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, reasoningTokens: 0, falImageCount: 0, falUpscaleCount: 0, midjourneyJobCount: 0, model };
}

function recordOpenAiUsage(tracker: UsageTracker, usage: { input_tokens: number; output_tokens: number; input_tokens_details?: { cached_tokens: number }; output_tokens_details?: { reasoning_tokens: number } } | undefined) {
  if (!usage) return;
  tracker.calls++;
  tracker.inputTokens += usage.input_tokens;
  tracker.outputTokens += usage.output_tokens;
  tracker.cachedInputTokens += usage.input_tokens_details?.cached_tokens ?? 0;
  tracker.reasoningTokens += usage.output_tokens_details?.reasoning_tokens ?? 0;
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
    ? `  Midjourney jobs:    ${tracker.midjourneyJobCount} ${DIM}(${tracker.midjourneyJobCount * 4} images)${RESET}`
    : `  Fal.ai images:      ${tracker.falImageCount} generated, ${tracker.falUpscaleCount} upscaled`;

  const costLines = IMAGE_PROVIDER === 'midjourney'
    ? ""
    : `
  Fal.ai total:       ${CYAN}$${falCost.toFixed(4)}${RESET} ${DIM}(${tracker.falImageCount} × $${FAL_PRICING["flux-pro"]} + ${tracker.falUpscaleCount} × $${FAL_PRICING["esrgan"]})${RESET}
  ${BOLD}Combined total:     ${CYAN}$${((inputCost ?? 0) + (outputCost ?? 0) + falCost).toFixed(4)}${RESET}`;

  // eslint-disable-next-line no-console
  console.log(`
${BOLD}── Usage Summary ──────────────────────────────────────────${RESET}
  Model:              ${tracker.model}
  OpenAI calls:       ${tracker.calls}
  Input tokens:       ${tracker.inputTokens.toLocaleString()} ${tracker.cachedInputTokens > 0 ? `${DIM}(${tracker.cachedInputTokens.toLocaleString()} cached)${RESET}` : ""}
  Output tokens:      ${tracker.outputTokens.toLocaleString()} ${tracker.reasoningTokens > 0 ? `${DIM}(${tracker.reasoningTokens.toLocaleString()} reasoning)${RESET}` : ""}
${imageProviderLine}
${BOLD}── Cost Estimate ──────────────────────────────────────────${RESET}${
  pricing
    ? `
  OpenAI input:       ${CYAN}$${inputCost!.toFixed(4)}${RESET} ${tracker.cachedInputTokens > 0 ? `${DIM}(${uncachedInputTokens.toLocaleString()} uncached × $${pricing.input}/M + ${tracker.cachedInputTokens.toLocaleString()} cached × $${pricing.cachedInput}/M)${RESET}` : ""}
  OpenAI output:      ${CYAN}$${outputCost!.toFixed(4)}${RESET}
  OpenAI total:       ${CYAN}$${(inputCost! + outputCost!).toFixed(4)}${RESET}`
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

async function getIllustrationDescriptions(
  openAiClient: OpenAI,
  essay: { title: string; content: string; promptsGenerated: number },
  tracker: UsageTracker,
  tryCount = 0
): Promise<string[]> {
  const { OpenAI } = await import("openai");
  const { zodTextFormat } = await import("openai/helpers/zod");

  const content = truncateContent(essay.content, 25_000);
  const response = await openAiClient.responses.parse({
    model: tracker.model,
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
        model: tracker.model,
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
    if (tryCount < 2) return getIllustrationDescriptions(openAiClient, essay, tracker, tryCount + 1);
    return [];
  }
}

async function getImagePrompts(
  openAiClient: OpenAI,
  essay: { title: string; content: string; promptsGenerated: number },
  tracker: UsageTracker
): Promise<string[]> {
  const descriptions = await getIllustrationDescriptions(openAiClient, essay, tracker);

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
const MJ_CHANNEL_ID = "singleplayer_15e7b155-feeb-4d9e-a0c7-376cd27758eb";
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
  type: "submit" | "cdn-check" | "download";
  body?: object;
  url?: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

let mjBridgeServer: http.Server | null = null;
const bridgeQueue: PendingBridgeRequest[] = [];
const inFlightRequests = new Map<string, PendingBridgeRequest>();

function startMidjourneyBridge(): Promise<void> {
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

function stopMidjourneyBridge() {
  if (mjBridgeServer) {
    mjBridgeServer.close();
    mjBridgeServer = null;
  }
}

/** Returns the JS snippet to paste/inject into the browser console. */
function getMjBridgeClientScript(): string {
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
    channelId: MJ_CHANNEL_ID,
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

function downloadViaBridge(url: string): Promise<string> {
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

async function pollMidjourneyCompletion(
  jobId: string,
  batchSize: number,
  initialDelayMs = 35_000,
  pollIntervalMs = 5_000,
  timeoutMs = 300_000
): Promise<string[]> {
  // eslint-disable-next-line no-console
  console.log(`Waiting ${initialDelayMs / 1000}s before polling CDN...`);
  await new Promise((resolve) => setTimeout(resolve, initialDelayMs));

  const startTime = Date.now();

  // Wait for images to become available on the CDN. The CDN transcodes to
  // multiple formats (.png, .webp, .jpeg) asynchronously, and which
  // index/format appears first is unpredictable. We check ALL indices and
  // formats each poll cycle, and once any image is ready we give an extra
  // delay for the rest to finish transcoding, then collect what's available.
  const IMAGE_FORMATS = ["png", "webp", "jpeg"];

  while (Date.now() - startTime < timeoutMs) {
    try {
      // Check if ANY image is available yet
      let anyReady = false;
      for (let i = 0; i < batchSize && !anyReady; i++) {
        for (const ext of IMAGE_FORMATS) {
          const result = await checkCdnViaBridge(`${MJ_CDN_BASE}/${jobId}/0_${i}.${ext}`);
          if (result.ok) {
            anyReady = true;
            break;
          }
        }
      }
      if (anyReady) {
        // At least one image is ready. Wait a bit for the rest to finish
        // transcoding, then collect all available URLs.
        // eslint-disable-next-line no-console
        console.log("First image detected, waiting 25s for remaining images to transcode...");
        await new Promise((resolve) => setTimeout(resolve, 25_000));

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
    } catch {
      // Bridge error, will retry
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Midjourney job ${jobId} timed out after ${timeoutMs / 1000}s`);
}

async function generateMidjourneyImages(prompt: string, tracker: UsageTracker): Promise<string[]> {
  const result = await submitMidjourneyJob(prompt);

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

  return imageUrls;
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

async function saveImageAsReviewWinnerArt(prompt: string, essay: Essay, url: string) {
  const shortPrompt = prompt.trim().replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32);
  const shortTitle = essay.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32);
  const originId = encodeURIComponent(`${shortTitle}_${shortPrompt}_${Math.random()}`);

  // For Midjourney, download the image through the browser bridge first,
  // since Cloudinary's server can't fetch MJ CDN URLs (Cloudflare blocks them).
  let uploadUrl = url;
  if (IMAGE_PROVIDER === 'midjourney') {
    // eslint-disable-next-line no-console
    console.log(`Downloading ${url} via browser bridge...`);
    uploadUrl = await downloadViaBridge(url);
  }

  const cloudinaryUrl = await moveImageToCloudinary({oldUrl: uploadUrl, originDocumentId: originId});
  if (!cloudinaryUrl) {
    // eslint-disable-next-line no-console
    console.error("Failed to upload image to Cloudinary", {prompt, postId: essay.postId});
    return;
  }

  const reviewWinnerArt = await createReviewWinnerArt({
    data: {
      postId: essay.postId,
      splashArtImagePrompt: prompt,
      splashArtImageUrl: cloudinaryUrl
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
    const reviewWinnerArt = await saveImageAsReviewWinnerArt(currentPrompt, essay, image);
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
    const imageUrls = await generateMidjourneyImages(currentPrompt, tracker);

    // Save each of the 4 grid images as a separate ReviewWinnerArt
    const results: EssayResult[] = [];
    for (const imageUrl of imageUrls) {
      const reviewWinnerArt = await saveImageAsReviewWinnerArt(currentPrompt, essay, imageUrl);
      results.push({ title: essay.title, prompt: currentPrompt, imageUrl, reviewWinnerArt });
    }
    return results;
  });

  const nestedResults = await Promise.all(jobPromises);
  return nestedResults.flat();
}

async function getArtForEssay(openAiClient: OpenAI, essay: Essay, tracker: UsageTracker, prompt?: string): Promise<EssayResult[]> {
  const prompts = prompt ? [prompt] : await getImagePrompts(openAiClient, essay, tracker);

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

  const openAiClient = await getOpenAI();
  if (!openAiClient) {
    throw new Error('Could not initialize OpenAI client!');
  }

  if (IMAGE_PROVIDER === 'midjourney') {
    await startMidjourneyBridge();
    // eslint-disable-next-line no-console
    console.log("\n=== Paste this into your Midjourney browser tab console: ===\n");
    // eslint-disable-next-line no-console
    console.log(getMjBridgeClientScript());
    // eslint-disable-next-line no-console
    console.log("\n=============================================================\n");
  }

  const tracker = createUsageTracker(OPENAI_MODEL);
  try {
    const results = await Promise.all(batch.map(essay => getArtForEssay(openAiClient, essay, tracker)));
    const totalImages = results.reduce((sum, r) => sum + r.length, 0);

    // eslint-disable-next-line no-console
    console.log(`\nGenerated ${totalImages} images for ${results.length} essays`);
    // eslint-disable-next-line no-console
    console.timeEnd('getReviewWinnerArts');
    printUsageSummary(tracker);
  } finally {
    stopMidjourneyBridge();
  }
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

  const openAiClient = await getOpenAI();
  if (!openAiClient) {
    throw new Error('Could not initialize OpenAI client!');
  }

  if (IMAGE_PROVIDER === 'midjourney') {
    await startMidjourneyBridge();
    // eslint-disable-next-line no-console
    console.log("\n=== Paste this into your Midjourney browser tab console: ===\n");
    // eslint-disable-next-line no-console
    console.log(getMjBridgeClientScript());
    // eslint-disable-next-line no-console
    console.log("\n=============================================================\n");
  }

  const tracker = createUsageTracker(OPENAI_MODEL);
  try {
    const results = await getArtForEssay(openAiClient, essay, tracker, prompt);

    // eslint-disable-next-line no-console
    console.timeEnd('generateCoverImagesForPost');
    printUsageSummary(tracker);

    return results;
  } finally {
    stopMidjourneyBridge();
  }
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

  const openAiClient = await getOpenAI();
  if (!openAiClient) {
    throw new Error('Could not initialize OpenAI client!');
  }

  const tracker = createUsageTracker(OPENAI_MODEL);
  const prompts = await getImagePrompts(openAiClient, { title: post.title, content: post.contents?.markdown ?? "", promptsGenerated: count }, tracker);

  printUsageSummary(tracker);

  return prompts;
};

// gvNnE6Th594kfdB3z
