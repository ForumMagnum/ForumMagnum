import uniq from "lodash/uniq";
import { makeCloudinaryFetchUrl } from "@/components/common/cloudinaryHelpers";

const MAX_CONTEXT_IMAGES = 20;
const MAX_IMAGE_DIMENSION = "1568";
const IMAGE_CHECK_TIMEOUT_MS = 30 * 1000;
// Cloudinary returns PNG instead of JPEG when the source is one of its own f_auto URLs
const SUPPORTED_MEDIA_TYPES = ["image/jpeg", "image/png"];

export interface LlmContextImage {
  url: string,
  mediaType: string,
}

/**
 * Takes image URLs in priority order. A single image that the provider can't
 * download or decode fails the whole model request, so every image goes
 * through Cloudinary as a size-limited JPEG, and images Cloudinary can't load
 * are left out.
 */
export async function loadLlmContextImages(imageUrls: string[]): Promise<LlmContextImage[]> {
  const candidateUrls = uniq(imageUrls.filter((url) => /^https?:\/\//i.test(url))).slice(0, MAX_CONTEXT_IMAGES);
  const images = await Promise.all(candidateUrls.map(loadLlmContextImage));
  return images.filter((image) => image !== null);
}

async function loadLlmContextImage(sourceUrl: string): Promise<LlmContextImage | null> {
  const url = makeCloudinaryFetchUrl(sourceUrl, { f: "jpg", q: "auto", c: "limit", w: MAX_IMAGE_DIMENSION, h: MAX_IMAGE_DIMENSION });
  const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(IMAGE_CHECK_TIMEOUT_MS) });
  if (response.status === 400 || response.status === 404) {
    return null;
  }
  const mediaType = response.headers.get("content-type");
  if (!response.ok || !mediaType || !SUPPORTED_MEDIA_TYPES.includes(mediaType)) {
    throw new Error(`Cloudinary returned ${response.status} (${mediaType}) for image ${sourceUrl}`);
  }
  return { url, mediaType };
}
