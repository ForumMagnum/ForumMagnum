import { makeCloudinaryFetchUrl } from "@/components/common/cloudinaryHelpers";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";

const CONTEXT_IMAGE_TOKEN_BUDGET = 500_000;
const MANY_IMAGES_MAX_TOKENS_PER_IMAGE = 11_000;
export const MAX_LLM_CONTEXT_IMAGES = Math.floor(CONTEXT_IMAGE_TOKEN_BUDGET / MANY_IMAGES_MAX_TOKENS_PER_IMAGE);
const MAX_IMAGE_DIMENSION = "5000";
const MANY_IMAGES_THRESHOLD = 20;
const MANY_IMAGES_MAX_DIMENSION = "3000";
const MAX_IMAGE_BASE64_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = MAX_IMAGE_BASE64_BYTES * 3 / 4;
const IMAGE_CHECK_TIMEOUT_MS = 30 * 1000;
const MAX_CONCURRENT_IMAGE_CHECKS = 10;
// Cloudinary fetch ignores f_jpg and returns the original format when the source is a Cloudinary f_auto URL
const CLOUDINARY_DELIVERY_TRANSFORMATION = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)[^/]+\/(?=v\d+\/)/;
const SOURCE_ERROR_PATTERNS = [
  /^Error in loading /,
  /^File size too large\. /,
  /^Invalid image file/,
  /^Maximum image size is /,
  /^public_id \(.*\) is too long$/,
  /^Resource not found - /,
];

export interface LlmContextImage {
  sourceUrl: string,
  url: string,
  mediaType: string,
}

export async function loadLlmContextImages(sourceUrls: string[]): Promise<LlmContextImage[]> {
  if (sourceUrls.length > MAX_LLM_CONTEXT_IMAGES) {
    throw new Error(`Got ${sourceUrls.length} context images, but a request can have at most ${MAX_LLM_CONTEXT_IMAGES}`);
  }
  const maxDimension = sourceUrls.length > MANY_IMAGES_THRESHOLD ? MANY_IMAGES_MAX_DIMENSION : MAX_IMAGE_DIMENSION;
  const imageLoaders = sourceUrls.map((sourceUrl) => () => loadLlmContextImage(sourceUrl, maxDimension));
  const images = await executePromiseQueue(imageLoaders, MAX_CONCURRENT_IMAGE_CHECKS);
  return images.filter((image) => image !== null);
}

async function loadLlmContextImage(sourceUrl: string, maxDimension: string): Promise<LlmContextImage | null> {
  const transformation = { f: "jpg", q: "auto", c: "limit", w: maxDimension, h: maxDimension };
  const url = makeCloudinaryFetchUrl(sourceUrl.replace(CLOUDINARY_DELIVERY_TRANSFORMATION, "$1"), transformation);
  const response = await fetchImageHead(url);
  if (!response || isSourceError(response)) {
    return null;
  }
  const mediaType = response.headers.get("content-type");
  const bytes = Number(response.headers.get("content-length"));
  if (!response.ok || mediaType !== "image/jpeg" || !bytes) {
    throw new Error(`Cloudinary returned ${response.status} (${mediaType}, ${bytes} bytes, error: ${response.headers.get("x-cld-error")}) for image ${sourceUrl}`);
  }
  return bytes <= MAX_IMAGE_BYTES ? { sourceUrl, url, mediaType } : null;
}

async function fetchImageHead(url: string): Promise<Response | null> {
  try {
    return await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(IMAGE_CHECK_TIMEOUT_MS) });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return null;
    }
    throw error;
  }
}

function isSourceError(response: Response): boolean {
  const cloudinaryError = response.headers.get("x-cld-error");
  return (response.status === 400 || response.status === 404)
    && !!cloudinaryError
    && SOURCE_ERROR_PATTERNS.some((pattern) => pattern.test(cloudinaryError));
}
