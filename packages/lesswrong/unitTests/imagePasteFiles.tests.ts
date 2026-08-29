import { getUniqueImageFiles } from "@/components/lexical/plugins/ImagesPlugin/ImageUtils";

function createFile(
  contents: string,
  name: string,
  type: string,
  lastModified: number,
): File {
  return new File([contents], name, { type, lastModified });
}

describe("getUniqueImageFiles", () => {
  it("deduplicates byte-identical clipboard entries for the same image", async () => {
    const first = createFile("image data", "screenshot.png", "image/png", 123);
    const duplicate = createFile("image data", "duplicate-name.png", "image/png", 456);

    await expect(getUniqueImageFiles([first, duplicate, duplicate])).resolves.toEqual([first]);
  });

  it("preserves distinct images with identical metadata and ignores non-image files", async () => {
    const first = createFile("first", "screenshot.png", "image/png", 123);
    const second = createFile("other", "screenshot.png", "image/png", 123);
    const text = createFile("notes", "notes.txt", "text/plain", 123);

    await expect(getUniqueImageFiles([first, text, second])).resolves.toEqual([first, second]);
  });
});
