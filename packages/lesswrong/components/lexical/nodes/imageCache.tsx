export type ImageStatus = 
  | { error: true; }
  | { error: false; width: number; height: number; };

export const imageCache = new Map<string, Promise<ImageStatus> | ImageStatus>();

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
      imageCache.set(src, { error: true });
      resolve();
    };
    img.src = src;
  });
}
