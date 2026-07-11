import type MarkdownIt from "markdown-it";
import type { Token } from "markdown-it/index.js";

const MAX_IMAGE_URLS_TO_VALIDATE = 30;
const IMAGE_URL_VALIDATION_TIMEOUT_MS = 4_000;

export interface AgentEditWarning {
  code: "image_url_invalid" | "image_url_unavailable" | "image_validation_failed" | "image_validation_skipped"
  message: string
  url?: string
}

interface MarkdownImageReference {
  url: string
}

function collectImageReferences(tokens: Token[], references: MarkdownImageReference[]): void {
  for (const token of tokens) {
    if (token.type === "image") {
      const url = token.attrGet("src");
      if (url) {
        references.push({ url });
      }
    }
    if (token.children) {
      collectImageReferences(token.children, references);
    }
  }
}

function extractMarkdownImageReferences(markdown: string, markdownIt: MarkdownIt): MarkdownImageReference[] {
  const tokens = markdownIt.parse(markdown, {});
  const references: MarkdownImageReference[] = [];
  collectImageReferences(tokens, references);
  return references;
}

function distinctImageUrls(references: MarkdownImageReference[]): string[] {
  return [...new Set(references.map((reference) => reference.url))];
}

function validateImageUrlSyntax(url: string): AgentEditWarning | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      code: "image_url_invalid",
      url,
      message: `Image URL ${JSON.stringify(url)} is not an absolute URL and may be dropped or fail to render.`,
    };
  }

  if (parsed.protocol === "http:" || parsed.protocol === "https:") {
    return null;
  }

  if (parsed.protocol === "data:") {
    return null;
  }

  return {
    code: "image_url_invalid",
    url,
    message: `Image URL ${JSON.stringify(url)} uses unsupported protocol ${parsed.protocol}; use http(s) or data URLs.`,
  };
}

function imageValidationSkippedWarning(skippedCount: number): AgentEditWarning {
  return {
    code: "image_validation_skipped",
    message: `${skippedCount} additional image URL${skippedCount === 1 ? " was" : "s were"} not checked; only the first ${MAX_IMAGE_URLS_TO_VALIDATE} distinct image URLs are validated.`,
  };
}

async function fetchImageUrl(url: string, method: "HEAD" | "GET", signal: AbortSignal): Promise<Response> {
  return fetch(url, {
    method,
    signal,
    redirect: "follow",
    headers: method === "GET" ? { Range: "bytes=0-0" } : undefined,
  });
}

function isMethodUnsupported(status: number): boolean {
  return status === 405 || status === 501;
}

function imageUnavailableWarning(url: string, status: number): AgentEditWarning {
  return {
    code: "image_url_unavailable",
    url,
    message: `Image URL ${JSON.stringify(url)} returned HTTP ${status} during validation and may not render in the editor.`,
  };
}

function imageValidationFailedWarning(url: string, error: unknown): AgentEditWarning {
  const errorMessage = error instanceof Error && error.name === "AbortError"
    ? "timed out"
    : error instanceof Error
      ? error.message
      : String(error);
  return {
    code: "image_validation_failed",
    url,
    message: `Image URL ${JSON.stringify(url)} could not be validated (${errorMessage}) and may not render in the editor.`,
  };
}

async function validateReachableImageUrl(url: string): Promise<AgentEditWarning | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IMAGE_URL_VALIDATION_TIMEOUT_MS);
  try {
    let response = await fetchImageUrl(url, "HEAD", controller.signal);
    if (isMethodUnsupported(response.status)) {
      response = await fetchImageUrl(url, "GET", controller.signal);
    }
    return response.ok ? null : imageUnavailableWarning(url, response.status);
  } catch (error) {
    return imageValidationFailedWarning(url, error);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function validateImageUrl(url: string): Promise<AgentEditWarning | null> {
  const syntaxWarning = validateImageUrlSyntax(url);
  if (syntaxWarning) {
    return syntaxWarning;
  }
  if (url.startsWith("data:")) {
    return null;
  }
  return validateReachableImageUrl(url);
}

export async function getMarkdownImageWarnings(markdown: string, markdownIt: MarkdownIt): Promise<AgentEditWarning[]> {
  const imageUrls = distinctImageUrls(extractMarkdownImageReferences(markdown, markdownIt));
  if (imageUrls.length === 0) {
    return [];
  }

  const urlsToValidate = imageUrls.slice(0, MAX_IMAGE_URLS_TO_VALIDATE);
  const warnings = (await Promise.all(urlsToValidate.map(validateImageUrl))).filter((warning) => warning !== null);
  const skippedCount = imageUrls.length - urlsToValidate.length;
  if (skippedCount > 0) {
    warnings.push(imageValidationSkippedWarning(skippedCount));
  }
  return warnings;
}

export function noteWithAgentEditWarnings(note: string, warnings: AgentEditWarning[] | undefined): string {
  if (!warnings || warnings.length === 0) {
    return note;
  }
  return `${note} Warning: ${warnings.length} image-related issue${warnings.length === 1 ? "" : "s"} detected; see the warnings field for details.`;
}
