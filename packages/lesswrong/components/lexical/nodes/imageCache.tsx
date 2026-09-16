export type ImageStatus = 
  | { error: true; }
  | { error: false; width: number; height: number; };

export const imageCache = new Map<string, Promise<ImageStatus> | ImageStatus>();

/**
 * Forget a previous image result so that the URL is fetched again next time it
 * is rendered. In particular, failed loads must not permanently blacklist a
 * URL: the resource may simply not have existed yet when it was first added.
 */
export function clearImageStatus(src: string): void {
  imageCache.delete(src);
}

/**
 * Preload an image into the cache so that useSuspenseImage returns
 * immediately without suspending. Used to prevent a visual flash when
 * swapping a blob URL for a Cloudinary URL after upload.
 */
export function preloadImage(src: string): Promise<void> {
  if (imageCache.has(src)) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, { error: false, width: img.naturalWidth, height: img.naturalHeight });
      resolve();
    };
    img.onerror = () => {
      clearImageStatus(src);
      resolve();
    };
    img.src = src;
  });
}
