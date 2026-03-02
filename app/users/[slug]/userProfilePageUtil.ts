import moment from "moment";
import { truncate } from "@/lib/editor/ellipsize";

// ── Constants ──

const BIO_COLLAPSED_WORD_LIMIT = 60;
const POST_SUMMARY_WORD_LIMIT = 50;
const SEPARATOR_LINE_PATTERN = /^[\s\-_=*~]{8,}$/;

export const DEFAULT_PREVIEWS = [
  "/profile-placeholder-1.png",
  "/profile-placeholder-2.png",
  "/profile-placeholder-3.png",
  "/profile-placeholder-4.png",
];

// ── Helper functions ──

// Post shape used by the profile page helper functions. Fields are optional
// to accommodate the DeepPartialObject wrapper that useQuery applies.
export interface PostWithPreview {
  _id: string;
  slug: string;
  title?: string | null;
  shortform?: boolean | null;
  baseScore?: number | null;
  postedAt?: string | null;
  contents?: { plaintextDescription?: string | null } | null;
  socialPreviewData?: { imageUrl?: string | null } | null;
}

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function cleanPostPreviewText(rawText: string): string {
  if (!rawText) return "";
  const normalized = rawText.replace(/\r\n?/g, "\n");
  const cleanedLines = normalized
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .map((line) => (SEPARATOR_LINE_PATTERN.test(line) ? "" : line));
  return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function truncatePreviewTextByWords(text: string, wordLimit: number): string {
  if (!text) return "";
  const tokens = text.match(/\S+|\s+/g) ?? [];
  let wordCount = 0;
  let result = "";

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      result += token;
      continue;
    }

    if (wordCount >= wordLimit) {
      return `${result.trimEnd()}...`;
    }

    result += token;
    wordCount += 1;
  }

  return result.trimEnd();
}

function collapsePreviewParagraphsForList(text: string): string {
  if (!text) return "";
  // Flatten paragraph/line breaks for list items while leaving visible
  // separation where breaks used to be.
  return text.replace(/\n+/g, "   ").replace(/ {4,}/g, "   ").trim();
}

export function getPostSummary(post: { contents?: { plaintextDescription?: string | null } | null }): string {
  const fullSummary = cleanPostPreviewText(post?.contents?.plaintextDescription ?? "");
  const singleParagraphSummary = collapsePreviewParagraphsForList(fullSummary);
  return truncatePreviewTextByWords(singleParagraphSummary, POST_SUMMARY_WORD_LIMIT);
}

export function getDefaultPreview(postId: string): string {
  return DEFAULT_PREVIEWS[hashString(postId) % DEFAULT_PREVIEWS.length];
}

export function cssUrl(url: string): string {
  // Use double-quoted CSS url(...) with JS escaping to avoid breakage from apostrophes.
  return `url(${JSON.stringify(url)})`;
}

export function getListPostImageUrl(post: PostWithPreview): string | null {
  const rawUrl = post?.socialPreviewData?.imageUrl;
  const imageUrl = rawUrl?.trim();
  if (!imageUrl || imageUrl === "null" || imageUrl === "undefined") return null;
  // List items should only show explicit per-post images, not placeholders.
  if (imageUrl.includes("/profile-placeholder-")) return null;
  if (imageUrl.includes("lh3.googleusercontent.com") || imageUrl.includes("docs.google.com")) {
    return null;
  }
  if (imageUrl.includes("res.cloudinary.com") && imageUrl.includes("/upload/")) {
    const urlWithoutQuery = imageUrl.split(/[?#]/)[0];
    if (urlWithoutQuery.endsWith("/")) return null;
    return imageUrl.replace("/upload/", "/upload/c_fill,g_auto,f_auto,q_auto/");
  }
  return imageUrl;
}

export function formatReadableDate(date: Date | string): string {
  const m = moment(new Date(date));
  if (m.year() === moment().year()) {
    return m.format("MMM D");
  }
  return m.format("MMM D, YYYY");
}

export function getCollapsedBioHtml(htmlBio: string, wordLimit=BIO_COLLAPSED_WORD_LIMIT): string {
  return truncate(htmlBio, wordLimit, "words");
}
