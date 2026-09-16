/**
 * @jest-environment jsdom
 */
import {
  clearImageStatus,
  imageCache,
  preloadImage,
} from "@/components/lexical/nodes/imageCache";

const IMAGE_URL = "https://example.com/eventually-available.png";

describe("image cache", () => {
  beforeEach(() => {
    imageCache.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("retries a URL after a failed preload", async () => {
    const BrowserImage = window.Image;
    jest.spyOn(window, "Image")
      .mockImplementationOnce(() => {
        const image = new BrowserImage();
        Object.defineProperty(image, "src", {
          set: () => image.dispatchEvent(new Event("error")),
        });
        return image;
      })
      .mockImplementationOnce(() => {
        const image = new BrowserImage();
        Object.defineProperties(image, {
          naturalWidth: { value: 640 },
          naturalHeight: { value: 480 },
          src: {
            set: () => image.dispatchEvent(new Event("load")),
          },
        });
        return image;
      });

    await preloadImage(IMAGE_URL);
    expect(imageCache.has(IMAGE_URL)).toBe(false);

    await preloadImage(IMAGE_URL);
    expect(imageCache.get(IMAGE_URL)).toEqual({
      error: false,
      width: 640,
      height: 480,
    });
  });

  it("can forget a failed render so the same URL is retried", () => {
    imageCache.set(IMAGE_URL, { error: true });

    clearImageStatus(IMAGE_URL);

    expect(imageCache.has(IMAGE_URL)).toBe(false);
  });
});
