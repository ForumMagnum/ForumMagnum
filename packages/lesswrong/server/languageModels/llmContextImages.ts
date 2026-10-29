import { makeCloudinaryFetchUrl } from "@/components/common/cloudinaryHelpers";

// Claude's limits, the strictest of the models we use. The image size limit is
// for Bedrock, which the gateway can route Claude to: 5 MiB of base64.
export const MAX_LLM_CONTEXT_IMAGES = 600;
const MAX_IMAGE_DIMENSION = "8000";
const MANY_IMAGES_THRESHOLD = 20;
const MANY_IMAGES_MAX_DIMENSION = "3000";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 * 3 / 4;
const SHRINK_MARGIN = 0.9;
const IMAGE_CHECK_TIMEOUT_MS = 30 * 1000;
// Cloudinary returns PNG instead of JPEG when the source is one of its own f_auto URLs
const SUPPORTED_MEDIA_TYPES = ["image/jpeg", "image/png"];

export interface LlmContextImage {
  sourceUrl: string,
  url: string,
  mediaType: string,
}

/**
 * A single image that the provider can't download or decode fails the whole
 * model request, so every image goes through Cloudinary as a JPEG within the
 * providers' limits, and images Cloudinary can't load are left out.
 */
export async function loadLlmContextImages(sourceUrls: string[]): Promise<LlmContextImage[]> {
  const maxDimension = sourceUrls.length > MANY_IMAGES_THRESHOLD ? MANY_IMAGES_MAX_DIMENSION : MAX_IMAGE_DIMENSION;
  const images = await Promise.all(sourceUrls.map((sourceUrl) => loadLlmContextImage(sourceUrl, maxDimension, 1)));
  return images.filter((image) => image !== null);
}

async function loadLlmContextImage(sourceUrl: string, maxDimension: string, scale: number): Promise<LlmContextImage | null> {
  const url = makeCloudinaryFetchUrl(sourceUrl, [
    { f: "jpg", q: "auto", c: "limit", w: maxDimension, h: maxDimension },
    ...(scale < 1 ? [{ c: "scale", w: scale.toFixed(2) }] : []),
  ]);
  const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(IMAGE_CHECK_TIMEOUT_MS) });
  if (response.status === 400 || response.status === 404) {
    return null;
  }
  const mediaType = response.headers.get("content-type");
  const bytes = Number(response.headers.get("content-length"));
  if (!response.ok || !mediaType || !SUPPORTED_MEDIA_TYPES.includes(mediaType) || !bytes) {
    throw new Error(`Cloudinary returned ${response.status} (${mediaType}, ${bytes} bytes) for image ${sourceUrl}`);
  }
  if (bytes > MAX_IMAGE_BYTES) {
    return await loadLlmContextImage(sourceUrl, maxDimension, scale * Math.sqrt(MAX_IMAGE_BYTES / bytes) * SHRINK_MARGIN);
  }
  return { sourceUrl, url, mediaType };
}
