import gql from "graphql-tag";
import { sanitize } from "@/lib/utils/sanitize";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { cloudinaryCloudNameSetting } from "@/lib/instanceSettings";
import { Images } from "@/server/collections/images/collection";
import { cloudinaryApiKey, cloudinaryApiSecret } from "@/server/databaseSettings";
import { cheerioParse } from "@/server/utils/htmlUtil";
import type { CheerioAPI } from 'cheerio';
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { randomId } from "@/lib/random";

const LINK_PREVIEW_CACHE_VERSION = 2;
const LINK_PREVIEW_REQUEST_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const LINK_PREVIEW_FETCH_TIMEOUT_MS = 8000;
const LINK_PREVIEW_IMAGE_FETCH_TIMEOUT_MS = 8000;
const MAX_REMOTE_HTML_LENGTH = 300_000;
const MAX_IMAGE_PROBE_BYTES = 262_144;
const MAX_EXCERPT_LENGTH = 3000;

interface LinkPreviewResult {
  title: string | null;
  imageUrl: string | null;
  originalImageUrl?: string | null;
  mirroredImageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  html: string | null;
  error: string | null;
  status: "success" | "error" | "in_progress";
  cacheVersion: number;
  fetchedAt: Date | null;
  nextRefreshAt: Date | null;
  debugTitleSource?: string | null;
  debugImageSource?: string | null;
  debugHtmlSource?: string | null;
}

interface LinkPreviewCacheRow {
  title: string | null;
  imageUrl: string | null;
  originalImageUrl?: string | null;
  mirroredImageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  sanitizedHtml: string | null;
  error: string | null;
  status: "success" | "error" | "in_progress";
  cacheVersion: number;
  fetchedAt: Date | null;
  nextRefreshAt: Date | null;
  debugTitleSource?: string | null;
  debugImageSource?: string | null;
  debugHtmlSource?: string | null;
}

interface ExtractedValue {
  value: string | null;
  source: string | null;
}

interface ExtractedImageSize {
  width: number;
  height: number;
}

interface ResolvedPreviewImage {
  imageUrl: string | null;
  originalImageUrl: string | null;
  mirroredImageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
}

export const crossSiteLinkPreviewGraphQLTypeDefs = gql`
  type CrossSiteLinkPreviewData {
    title: String
    imageUrl: String
    originalImageUrl: String
    mirroredImageUrl: String
    imageWidth: Int
    imageHeight: Int
    html: String
    error: String
    status: String
    cacheVersion: Int
    fetchedAt: Date
    nextRefreshAt: Date
    debugTitleSource: String
    debugImageSource: String
    debugHtmlSource: String
  }

  extend type Query {
    crossSiteLinkPreview(url: String!, forceRefetch: Boolean, includeDebug: Boolean): CrossSiteLinkPreviewData
  }
`;

function truncate(value: string | null | undefined, max = MAX_EXCERPT_LENGTH): string | null {
  if (!value) {
    return null;
  }
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizePreviewUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("URL is empty");
  }
  const parsed = new URL(trimmed);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) URLs are supported");
  }
  parsed.hash = "";
  return parsed.toString();
}

function getTagSource($: CheerioAPI, selector: string): string | null {
  const selected = $(selector).first();
  if (!selected || selected.length === 0) {
    return null;
  }
  return truncate($.html(selected));
}

function extractMetaContent($: CheerioAPI, selectors: string[]): ExtractedValue {
  for (const selector of selectors) {
    const selected = $(selector).first();
    const value = selected.attr("content")?.trim();
    if (value) {
      return {
        value,
        source: getTagSource($, selector),
      };
    }
  }
  return {
    value: null,
    source: null,
  };
}

function extractTitle($: CheerioAPI): ExtractedValue {
  const fromMeta = extractMetaContent($, [
    "meta[property='og:title']",
    "meta[name='twitter:title']",
    "meta[name='title']",
  ]);
  if (fromMeta.value) {
    return fromMeta;
  }

  const titleTag = $("title").first();
  const title = titleTag.text()?.trim() || null;
  return {
    value: title,
    source: title ? truncate($.html(titleTag)) : null,
  };
}

function extractImageUrl($: CheerioAPI): ExtractedValue {
  const fromMeta = extractMetaContent($, [
    "meta[property='og:image']",
    "meta[name='twitter:image']",
    "meta[itemprop='image']",
  ]);
  if (!fromMeta.value) {
    return fromMeta;
  }
  if (isBlankImageFilename(fromMeta.value)) {
    return {
      value: null,
      source: null,
    };
  }
  return fromMeta;
}

function extractDescription($: CheerioAPI): ExtractedValue {
  return extractMetaContent($, [
    "meta[property='og:description']",
    "meta[name='twitter:description']",
    "meta[name='description']",
  ]);
}

function descriptionLooksUseful(description: string | null | undefined): boolean {
  if (!description) {
    return false;
  }
  const trimmed = description.trim();
  if (trimmed.length < 12) {
    return false;
  }
  if (/^[.\u2026\s-]+$/.test(trimmed)) {
    return false;
  }
  return true;
}

function isBlankImageFilename(imageUrl: string): boolean {
  try {
    const parsed = new URL(imageUrl);
    const pathname = parsed.pathname ?? "";
    const filename = pathname.split("/").pop() ?? "";
    return /^blank\.[a-z0-9]+$/i.test(filename);
  } catch {
    const withoutQueryOrHash = imageUrl.split(/[?#]/)[0] ?? "";
    const filename = withoutQueryOrHash.split("/").pop() ?? "";
    return /^blank\.[a-z0-9]+$/i.test(filename);
  }
}

function isWikipediaUrl(pageUrl: string | null | undefined): boolean {
  if (!pageUrl) {
    return false;
  }
  try {
    const parsed = new URL(pageUrl);
    return parsed.hostname.endsWith(".wikipedia.org");
  } catch {
    return false;
  }
}

function cleanBodyText(text: string): string {
  return text
    .replace(/\[(\d+|citation needed)\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBodyDescriptionFromSelectors(
  $: CheerioAPI,
  selectors: string[],
  minLength = 80,
): ExtractedValue {
  for (const selector of selectors) {
    const paragraphs = $(selector);
    for (const paragraph of paragraphs.toArray()) {
      const selected = $(paragraph);
      const cleaned = cleanBodyText(selected.text());
      if (cleaned.length >= minLength) {
        return {
          value: truncate(cleaned),
          source: truncate($.html(selected)),
        };
      }
    }
  }
  return {
    value: null,
    source: null,
  };
}

function extractWikipediaBodyDescription($: CheerioAPI): ExtractedValue {
  return extractBodyDescriptionFromSelectors($, [
    "#mw-content-text .mw-parser-output > p",
    ".mw-parser-output > p",
    "#mw-content-text p",
  ]);
}

function isLikelySubstackPage($: CheerioAPI, pageUrl: string): boolean {
  const hasSubstackMarkup = $(".available-content .body.markup").length > 0
    || $("article.newsletter-post").length > 0;
  if (hasSubstackMarkup) {
    return true;
  }
  try {
    const parsed = new URL(pageUrl);
    return parsed.hostname.endsWith(".substack.com");
  } catch {
    return false;
  }
}

function extractSubstackBodyDescription($: CheerioAPI): ExtractedValue {
  return extractBodyDescriptionFromSelectors($, [
    ".available-content .body.markup > p",
    ".available-content .body > p",
    "article.newsletter-post p",
  ]);
}

function extractGenericBodyDescription($: CheerioAPI): ExtractedValue {
  return extractBodyDescriptionFromSelectors($, [
    "body > main > article .content > p",
    "body > main > article .entry-content > p",
    "body > main > article .post-content > p",
    "body > main > article p",
    "article .content > p",
    "article .entry-content > p",
    "article .post-content > p",
    "article p",
    "main article p",
    "main p",
  ]);
}

function extractDescriptionWithFallback($: CheerioAPI, pageUrl: string): ExtractedValue {
  const fromMeta = extractDescription($);
  if (descriptionLooksUseful(fromMeta.value)) {
    return fromMeta;
  }
  if (isWikipediaUrl(pageUrl)) {
    return extractWikipediaBodyDescription($);
  }
  if (isLikelySubstackPage($, pageUrl)) {
    const fromBody = extractSubstackBodyDescription($);
    if (fromBody.value) {
      return fromBody;
    }
  }
  const fromGenericBody = extractGenericBodyDescription($);
  if (fromGenericBody.value) {
    return fromGenericBody;
  }
  if (fromMeta.value) {
    return fromMeta;
  }
  return {
    value: null,
    source: null,
  };
}

function normalizeForComparison(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeCompact(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function containsTwitterOrX(text: string): boolean {
  const normalized = normalizeForComparison(text);
  return normalized.includes("twitter") || /\bon x\b/.test(normalized) || normalized === "x";
}

function shouldIncludeSiteName({
  title,
  description,
  siteName,
}: {
  title: string | null;
  description: string | null;
  siteName: string | null;
}): boolean {
  if (!siteName) {
    return false;
  }
  if (!title && !description) {
    return true;
  }

  const compactSiteName = normalizeCompact(siteName);
  const compactTitle = normalizeCompact(title ?? "");
  if (compactSiteName && compactTitle.includes(compactSiteName)) {
    return false;
  }

  const normalizedDescription = normalizeForComparison(description ?? "");
  const normalizedSiteName = normalizeForComparison(siteName);
  if (normalizedDescription.startsWith(normalizedSiteName)) {
    return false;
  }

  if (title && containsTwitterOrX(title) && containsTwitterOrX(siteName)) {
    return false;
  }

  return true;
}

function stripTitleFromDescription(title: string | null, description: string | null): string | null {
  if (!description) {
    return null;
  }
  if (!title) {
    return description;
  }

  let cleaned = description.trim();
  const normalizedTitle = normalizeForComparison(title);
  if (!normalizedTitle) {
    return cleaned || null;
  }

  const separators = [" - ", " | ", ": ", " — ", " – "];
  const normalizedDescription = normalizeForComparison(cleaned);
  if (normalizedDescription === normalizedTitle) {
    return null;
  }

  for (const separator of separators) {
    const prefix = `${title}${separator}`;
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
    }

    const suffix = `${separator}${title}`;
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.slice(0, cleaned.length - suffix.length).trim();
    }
  }

  if (!cleaned) {
    return null;
  }

  return normalizeForComparison(cleaned) === normalizedTitle ? null : cleaned;
}

function buildSanitizedPreviewHtml({
  title,
  description,
  siteName,
}: {
  title: string | null;
  description: string | null;
  siteName: string | null;
}): string | null {
  const pieces: string[] = [];
  const cleanedDescription = stripTitleFromDescription(title, description);
  if (siteName && shouldIncludeSiteName({ title, description: cleanedDescription, siteName })) {
    pieces.push(`<div>${escapeHtml(siteName)}</div>`);
  }
  if (cleanedDescription) {
    pieces.push(`<p>${escapeHtml(cleanedDescription)}</p>`);
  }
  if (pieces.length === 0) {
    return null;
  }
  return sanitize(`<div>${pieces.join("")}</div>`);
}

function getCloudinaryCredentials():
  { cloud_name: string; api_key: string; api_secret: string } | null {
  const cloudName = cloudinaryCloudNameSetting.get();
  const apiKey = cloudinaryApiKey.get();
  const apiSecret = cloudinaryApiSecret.get();
  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }
  return {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  };
}

function parsePngDimensions(bytes: Uint8Array): ExtractedImageSize | null {
  if (bytes.length < 24) {
    return null;
  }
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < pngSignature.length; i += 1) {
    if (bytes[i] !== pngSignature[i]) {
      return null;
    }
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  if (!width || !height) {
    return null;
  }
  return { width, height };
}

function parseGifDimensions(bytes: Uint8Array): ExtractedImageSize | null {
  if (bytes.length < 10) {
    return null;
  }
  const header = String.fromCharCode(...bytes.slice(0, 6));
  if (header !== "GIF87a" && header !== "GIF89a") {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint16(6, true);
  const height = view.getUint16(8, true);
  if (!width || !height) {
    return null;
  }
  return { width, height };
}

function parseJpegDimensions(bytes: Uint8Array): ExtractedImageSize | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    if (offset + 3 >= bytes.length) {
      return null;
    }
    const segmentLength = view.getUint16(offset + 2, false);
    if (segmentLength < 2) {
      return null;
    }
    const isStartOfFrame = (
      (marker >= 0xc0 && marker <= 0xc3)
      || (marker >= 0xc5 && marker <= 0xc7)
      || (marker >= 0xc9 && marker <= 0xcb)
      || (marker >= 0xcd && marker <= 0xcf)
    );
    if (isStartOfFrame) {
      if (offset + 8 >= bytes.length) {
        return null;
      }
      const height = view.getUint16(offset + 5, false);
      const width = view.getUint16(offset + 7, false);
      if (!width || !height) {
        return null;
      }
      return { width, height };
    }
    offset += 2 + segmentLength;
  }
  return null;
}

function parseWebpDimensions(bytes: Uint8Array): ExtractedImageSize | null {
  if (bytes.length < 30) {
    return null;
  }
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff !== "RIFF" || webp !== "WEBP") {
    return null;
  }
  const chunkType = String.fromCharCode(...bytes.slice(12, 16));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (chunkType === "VP8X" && bytes.length >= 30) {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    if (!width || !height) {
      return null;
    }
    return { width, height };
  }
  if (chunkType === "VP8L" && bytes.length >= 25) {
    const bits = view.getUint32(21, true);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    if (!width || !height) {
      return null;
    }
    return { width, height };
  }
  return null;
}

function parseImageDimensions(bytes: Uint8Array): ExtractedImageSize | null {
  return parsePngDimensions(bytes)
    ?? parseJpegDimensions(bytes)
    ?? parseGifDimensions(bytes)
    ?? parseWebpDimensions(bytes);
}

async function fetchImageDimensions(url: string): Promise<ExtractedImageSize | null> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), LINK_PREVIEW_IMAGE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: abortController.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "LessWrong-LinkPreviewBot/1.0 (+https://www.lesswrong.com)",
        "Accept": "image/*,*/*;q=0.1",
        "Range": `bytes=0-${MAX_IMAGE_PROBE_BYTES - 1}`,
      },
    });
    if (!response.ok) {
      return null;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.toLowerCase().startsWith("image/")) {
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return parseImageDimensions(new Uint8Array(arrayBuffer));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function mirrorImageToCloudinary(originalImageUrl: string): Promise<string | null> {
  const existingMirror = await Images.findOne({
    identifier: originalImageUrl,
    identifierType: "originalUrl",
  });
  if (existingMirror?.cdnHostedUrl) {
    return existingMirror.cdnHostedUrl;
  }

  const credentials = getCloudinaryCredentials();
  if (!credentials) {
    return null;
  }

  const cloudinary = await import("cloudinary");
  const uploadResult = await cloudinary.v2.uploader.upload(originalImageUrl, {
    folder: "mirroredLinkPreviewImages",
    ...credentials,
  });
  const mirroredImageUrl = cloudinary.v2.url(uploadResult.public_id, {
    ...credentials,
    quality: "auto",
    fetch_format: "auto",
    secure: true,
  });

  await Images.rawInsert({
    identifier: originalImageUrl,
    identifierType: "originalUrl",
    cdnHostedUrl: mirroredImageUrl,
    originalUrl: null,
  });

  return mirroredImageUrl;
}

async function resolvePreviewImage(rawImageUrl: string | null): Promise<ResolvedPreviewImage> {
  if (!rawImageUrl) {
    return {
      imageUrl: null,
      originalImageUrl: null,
      mirroredImageUrl: null,
      imageWidth: null,
      imageHeight: null,
    };
  }

  let mirroredImageUrl: string | null = null;
  try {
    mirroredImageUrl = await mirrorImageToCloudinary(rawImageUrl);
  } catch {
    mirroredImageUrl = null;
  }

  const imageUrl = mirroredImageUrl ?? rawImageUrl;
  const dimensions = await fetchImageDimensions(imageUrl) ?? await fetchImageDimensions(rawImageUrl);
  return {
    imageUrl,
    originalImageUrl: rawImageUrl,
    mirroredImageUrl,
    imageWidth: dimensions?.width ?? null,
    imageHeight: dimensions?.height ?? null,
  };
}

function getPreviewProjection(includeDebug: boolean): string {
  const debugColumns = includeDebug
    ? `, "debugTitleSource", "debugImageSource", "debugHtmlSource"`
    : "";
  return `
    SELECT
      "title",
      "imageUrl",
      "originalImageUrl",
      "mirroredImageUrl",
      "imageWidth",
      "imageHeight",
      "sanitizedHtml",
      "error",
      "status",
      "cacheVersion",
      "fetchedAt",
      "nextRefreshAt"
      ${debugColumns}
    FROM "LinkPreviewCaches"
    WHERE "url" = $(url)
  `;
}

async function getCachedPreview(url: string, includeDebug: boolean): Promise<LinkPreviewCacheRow | null> {
  const sqlClient = getSqlClientOrThrow();
  return sqlClient.oneOrNone(getPreviewProjection(includeDebug), { url });
}

function toResolverResult(row: LinkPreviewCacheRow | null): LinkPreviewResult | null {
  if (!row) {
    return null;
  }
  return {
    title: row.title,
    imageUrl: row.imageUrl,
    originalImageUrl: row.originalImageUrl ?? null,
    mirroredImageUrl: row.mirroredImageUrl ?? null,
    imageWidth: row.imageWidth ?? null,
    imageHeight: row.imageHeight ?? null,
    html: row.sanitizedHtml,
    error: row.error,
    status: row.status,
    cacheVersion: row.cacheVersion,
    fetchedAt: row.fetchedAt,
    nextRefreshAt: row.nextRefreshAt,
    debugTitleSource: row.debugTitleSource ?? null,
    debugImageSource: row.debugImageSource ?? null,
    debugHtmlSource: row.debugHtmlSource ?? null,
  };
}

function cacheIsReusable(row: LinkPreviewCacheRow | null, forceRefetch: boolean, now: Date): boolean {
  if (!row) {
    return false;
  }
  if (forceRefetch) {
    return false;
  }
  if (row.cacheVersion !== LINK_PREVIEW_CACHE_VERSION) {
    return false;
  }
  return !!row.nextRefreshAt && row.nextRefreshAt > now;
}

async function claimFetchSlot(url: string, now: Date, forceRefetch: boolean): Promise<boolean> {
  const sqlClient = getSqlClientOrThrow();
  const nextRefreshAt = new Date(now.getTime() + LINK_PREVIEW_REQUEST_COOLDOWN_MS);
  const acquired = await sqlClient.oneOrNone(`
    INSERT INTO "LinkPreviewCaches" (
      "_id",
      "url",
      "cacheVersion",
      "status",
      "requestStartedAt",
      "nextRefreshAt",
      "createdAt"
    ) VALUES (
      $(_id),
      $(url),
      $(cacheVersion),
      'in_progress',
      $(now),
      $(nextRefreshAt),
      $(now)
    )
    ON CONFLICT ("url") DO UPDATE
    SET
      "cacheVersion" = EXCLUDED."cacheVersion",
      "status" = 'in_progress',
      "requestStartedAt" = EXCLUDED."requestStartedAt",
      "nextRefreshAt" = EXCLUDED."nextRefreshAt"
    WHERE
      "LinkPreviewCaches"."nextRefreshAt" <= $(now)
      OR "LinkPreviewCaches"."cacheVersion" <> $(cacheVersion)
      OR $(forceRefetch)
    RETURNING "_id"
  `, {
    _id: randomId(),
    url,
    now,
    nextRefreshAt,
    forceRefetch,
    cacheVersion: LINK_PREVIEW_CACHE_VERSION,
  });
  return !!acquired;
}

async function fetchRemoteHtml(url: string): Promise<string> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), LINK_PREVIEW_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: abortController.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "LessWrong-LinkPreviewBot/1.0 (+https://www.lesswrong.com)",
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("html")) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
    const html = await response.text();
    return html.length > MAX_REMOTE_HTML_LENGTH ? html.slice(0, MAX_REMOTE_HTML_LENGTH) : html;
  } finally {
    clearTimeout(timeout);
  }
}

async function writeResultToCache({
  url,
  title,
  imageUrl,
  originalImageUrl,
  mirroredImageUrl,
  imageWidth,
  imageHeight,
  sanitizedHtml,
  error,
  status,
  remoteHtml,
  debugTitleSource,
  debugImageSource,
  debugHtmlSource,
}: {
  url: string;
  title: string | null;
  imageUrl: string | null;
  originalImageUrl: string | null;
  mirroredImageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  sanitizedHtml: string | null;
  error: string | null;
  status: "success" | "error";
  remoteHtml: string | null;
  debugTitleSource: string | null;
  debugImageSource: string | null;
  debugHtmlSource: string | null;
}) {
  const sqlClient = getSqlClientOrThrow();
  const now = new Date();
  const nextRefreshAt = new Date(now.getTime() + LINK_PREVIEW_REQUEST_COOLDOWN_MS);
  await sqlClient.none(`
    UPDATE "LinkPreviewCaches"
    SET
      "cacheVersion" = $(cacheVersion),
      "status" = $(status),
      "title" = $(title),
      "imageUrl" = $(imageUrl),
      "originalImageUrl" = $(originalImageUrl),
      "mirroredImageUrl" = $(mirroredImageUrl),
      "imageWidth" = $(imageWidth),
      "imageHeight" = $(imageHeight),
      "sanitizedHtml" = $(sanitizedHtml),
      "error" = $(error),
      "fetchedAt" = $(now),
      "nextRefreshAt" = $(nextRefreshAt),
      "remoteHtml" = $(remoteHtml),
      "debugTitleSource" = $(debugTitleSource),
      "debugImageSource" = $(debugImageSource),
      "debugHtmlSource" = $(debugHtmlSource)
    WHERE "url" = $(url)
  `, {
    cacheVersion: LINK_PREVIEW_CACHE_VERSION,
    status,
    title,
    imageUrl,
    originalImageUrl,
    mirroredImageUrl,
    imageWidth,
    imageHeight,
    sanitizedHtml,
    error,
    now,
    nextRefreshAt,
    remoteHtml,
    debugTitleSource,
    debugImageSource,
    debugHtmlSource,
    url,
  });
}

function parsePreviewFromHtml(rawHtml: string, pageUrl: string): {
  title: string | null;
  imageUrl: string | null;
  sanitizedHtml: string | null;
  debugTitleSource: string | null;
  debugImageSource: string | null;
  debugHtmlSource: string | null;
} {
  const $ = cheerioParse(rawHtml);
  const title = extractTitle($);
  const image = extractImageUrl($);
  const description = extractDescriptionWithFallback($, pageUrl);
  const siteName = extractMetaContent($, ["meta[property='og:site_name']"]).value;

  return {
    title: title.value,
    imageUrl: image.value,
    sanitizedHtml: buildSanitizedPreviewHtml({
      title: title.value,
      description: description.value,
      siteName,
    }),
    debugTitleSource: title.source,
    debugImageSource: image.source,
    debugHtmlSource: description.source,
  };
}

async function resolveCrossSitePreview({ url, forceRefetch, includeDebug }: {
  url: string;
  forceRefetch: boolean;
  includeDebug: boolean;
}): Promise<LinkPreviewResult> {
  const normalizedUrl = normalizePreviewUrl(url);
  const now = new Date();

  const cachedResult = await getCachedPreview(normalizedUrl, includeDebug);
  if (cacheIsReusable(cachedResult, forceRefetch, now)) {
    return toResolverResult(cachedResult)!;
  }

  const hasSlot = await claimFetchSlot(normalizedUrl, now, forceRefetch);
  if (!hasSlot) {
    const updatedCache = await getCachedPreview(normalizedUrl, includeDebug);
    const fromCache = toResolverResult(updatedCache);
    if (fromCache) {
      return fromCache;
    }
    return {
      title: null,
      imageUrl: null,
      html: null,
      error: "Preview generation is already in progress",
      status: "in_progress",
      cacheVersion: LINK_PREVIEW_CACHE_VERSION,
      fetchedAt: null,
      nextRefreshAt: null,
    };
  }

  try {
    const remoteHtml = await fetchRemoteHtml(normalizedUrl);
    const parsed = parsePreviewFromHtml(remoteHtml, normalizedUrl);
    const resolvedImage = await resolvePreviewImage(parsed.imageUrl);
    const hasPreviewData = !!(parsed.title || resolvedImage.imageUrl || parsed.sanitizedHtml);
    if (!hasPreviewData) {
      throw new Error("No previewable metadata found");
    }

    await writeResultToCache({
      url: normalizedUrl,
      title: parsed.title,
      imageUrl: resolvedImage.imageUrl,
      originalImageUrl: resolvedImage.originalImageUrl,
      mirroredImageUrl: resolvedImage.mirroredImageUrl,
      imageWidth: resolvedImage.imageWidth,
      imageHeight: resolvedImage.imageHeight,
      sanitizedHtml: parsed.sanitizedHtml,
      error: null,
      status: "success",
      remoteHtml,
      debugTitleSource: parsed.debugTitleSource,
      debugImageSource: parsed.debugImageSource,
      debugHtmlSource: parsed.debugHtmlSource,
    });
  } catch (error) {
    await writeResultToCache({
      url: normalizedUrl,
      title: null,
      imageUrl: null,
      originalImageUrl: null,
      mirroredImageUrl: null,
      imageWidth: null,
      imageHeight: null,
      sanitizedHtml: null,
      error: error instanceof Error ? truncate(error.message) : "Unknown preview error",
      status: "error",
      remoteHtml: null,
      debugTitleSource: null,
      debugImageSource: null,
      debugHtmlSource: null,
    });
  }

  const freshResult = await getCachedPreview(normalizedUrl, includeDebug);
  const response = toResolverResult(freshResult);
  if (response) {
    return response;
  }
  return {
    title: null,
    imageUrl: null,
    html: null,
    error: "Failed to load link preview",
    status: "error",
    cacheVersion: LINK_PREVIEW_CACHE_VERSION,
    fetchedAt: null,
    nextRefreshAt: null,
  };
}

export async function debugParseCrossSitePreview(url: string) {
  const normalizedUrl = normalizePreviewUrl(url);
  const remoteHtml = await fetchRemoteHtml(normalizedUrl);
  const parsed = parsePreviewFromHtml(remoteHtml, normalizedUrl);
  const resolvedImage = await resolvePreviewImage(parsed.imageUrl);
  return {
    url: normalizedUrl,
    title: parsed.title,
    imageUrl: resolvedImage.imageUrl,
    originalImageUrl: resolvedImage.originalImageUrl,
    mirroredImageUrl: resolvedImage.mirroredImageUrl,
    imageWidth: resolvedImage.imageWidth,
    imageHeight: resolvedImage.imageHeight,
    html: parsed.sanitizedHtml,
    debugTitleSource: parsed.debugTitleSource,
    debugImageSource: parsed.debugImageSource,
    debugHtmlSource: parsed.debugHtmlSource,
  };
}

export const crossSiteLinkPreviewGraphQLQueries = {
  async crossSiteLinkPreview(
    _root: void,
    {
      url,
      forceRefetch = false,
      includeDebug = false,
    }: {
      url: string;
      forceRefetch?: boolean;
      includeDebug?: boolean;
    },
    context: ResolverContext,
  ) {
    const canDebug = userIsAdminOrMod(context.currentUser);
    return resolveCrossSitePreview({
      url,
      forceRefetch: canDebug && !!forceRefetch,
      includeDebug: canDebug && !!includeDebug,
    });
  },
};

