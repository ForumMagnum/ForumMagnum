import { getImageAltText, isImageFile } from "../components/lexical/plugins/ImagesPlugin/ImageUtils";
import { getAnimatedWebpCloudinaryUrl } from "../components/lexical/utils/cloudinaryUpload";

describe("Lexical image uploads", () => {
  describe("isImageFile", () => {
    it("accepts normal image MIME types", () => {
      expect(isImageFile(new Blob(["png"], { type: "image/png" }))).toBe(true);
      expect(isImageFile(new Blob(["gif"], { type: "image/gif" }))).toBe(true);
      expect(isImageFile(new Blob(["webp"], { type: "image/webp" }))).toBe(true);
    });

    it("accepts image files with missing MIME types when the extension is known", () => {
      expect(isImageFile(new File(["gif"], "animation.gif", { type: "" }))).toBe(true);
      expect(isImageFile(new File(["heic"], "photo.heic", { type: "" }))).toBe(true);
      expect(isImageFile(new File(["gif"], "animation.gif", { type: "application/octet-stream" }))).toBe(true);
    });

    it("rejects non-image files", () => {
      expect(isImageFile(new File(["text"], "not-an-image.txt", { type: "text/plain" }))).toBe(false);
      expect(isImageFile(new File(["text"], "not-an-image.gif", { type: "text/plain" }))).toBe(false);
      expect(isImageFile(new Blob(["text"], { type: "text/plain" }))).toBe(false);
    });
  });

  describe("getImageAltText", () => {
    it("uses filenames when available", () => {
      expect(getImageAltText(new File(["gif"], "animation.gif", { type: "image/gif" }))).toBe("animation.gif");
    });

    it("uses a generic fallback for blobs", () => {
      expect(getImageAltText(new Blob(["gif"], { type: "image/gif" }))).toBe("Pasted image");
    });
  });

  describe("getAnimatedWebpCloudinaryUrl", () => {
    it("adds an animated WebP delivery transform to Cloudinary upload URLs", () => {
      expect(
        getAnimatedWebpCloudinaryUrl("https://res.cloudinary.com/lw/image/upload/v123/editor/animation.gif")
      ).toBe("https://res.cloudinary.com/lw/image/upload/f_webp,fl_animated/v123/editor/animation.gif");
    });

    it("does not duplicate an existing animated WebP transform", () => {
      const url = "https://res.cloudinary.com/lw/image/upload/f_webp,fl_animated/v123/editor/animation.gif";
      expect(getAnimatedWebpCloudinaryUrl(url)).toBe(url);
    });

    it("leaves non-Cloudinary-shaped URLs unchanged", () => {
      const url = "https://example.com/animation.gif";
      expect(getAnimatedWebpCloudinaryUrl(url)).toBe(url);
    });
  });
});
