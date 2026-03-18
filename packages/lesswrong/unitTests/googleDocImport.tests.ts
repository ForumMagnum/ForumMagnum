import JSZip from 'jszip';
import { convertImportedGoogleDoc, replaceGoogleDocMarkdownImagesWithOriginals } from '@/server/editor/googleDocUtils';

async function createGoogleDocZip(files: Record<string, string>): Promise<Buffer> {
  const zip = new JSZip();

  for (const [fileName, contents] of Object.entries(files)) {
    zip.file(fileName, contents);
  }

  return zip.generateAsync({ type: 'nodebuffer' });
}

describe("convertImportedGoogleDoc", () => {
  it("replaces markdown image data with originals from the zip export", async () => {
    const lowResolutionImage = Buffer.from("low-resolution-image").toString("base64");
    const highResolutionImage = Buffer.from("high-resolution-image").toString("base64");
    const zipBuffer = await createGoogleDocZip({
      "images/image1.jpg": "high-resolution-image",
    });
    const markdown = `![][image1]

[image1]: <data:image/png;base64,${lowResolutionImage}>`;

    const mergedMarkdown = await replaceGoogleDocMarkdownImagesWithOriginals({
      markdown,
      zipBuffer,
    });

    expect(mergedMarkdown).toContain(`data:image/jpeg;base64,${highResolutionImage}`);
    expect(mergedMarkdown).not.toContain(lowResolutionImage);
  });

  it("leaves markdown images alone when the zip export has no matching original", async () => {
    const lowResolutionImage = Buffer.from("low-resolution-image").toString("base64");
    const zipBuffer = await createGoogleDocZip({
      "images/image2.jpg": "some-other-image",
    });
    const markdown = `![][image1]

[image1]: <data:image/png;base64,${lowResolutionImage}>`;

    const mergedMarkdown = await replaceGoogleDocMarkdownImagesWithOriginals({
      markdown,
      zipBuffer,
    });

    expect(mergedMarkdown).toContain(lowResolutionImage);
  });

  it("Regression: Handle nested bullets with different list ids", async () => {
    const htmlInput = `
      <html>
        <body>
          <p><span></span></p>
          <p><span>Paragraph</span></p>
          <ul class="lst-kix_gia5zvmdml9o-0 start">
            <li><span>Bullet 1</span></li>
            <li><span>Bullet 2</span></li>
          </ul>
          <h2 data-internal-id="Header"><span>Header</span></h2>
          <ul class="lst-kix_82zwahk8jahu-0 start">
            <li><span>Start of a second list</span></li>
          </ul>
          <ul class="lst-kix_gia5zvmdml9o-0">
            <li><span>Bullet copy-pasted from the first list</span></li>
          </ul>
          <ul class="lst-kix_gia5zvmdml9o-1 start">
            <li><span>Sub-bullet 1</span></li>
            <li><span>Sub-bullet 2</span></li>
          </ul>
        </body>
      </html>
    `;
    const htmlOutput = await convertImportedGoogleDoc({html: htmlInput.replace(/\s+</g, '<'), postId: 'dummy'});
    expect(htmlOutput).toMatchSnapshot();
  });
});
