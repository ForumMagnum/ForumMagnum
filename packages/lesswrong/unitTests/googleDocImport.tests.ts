import JSZip from 'jszip';
import { convertImportedGoogleDoc, getGoogleDocZipHtml } from '@/server/editor/googleDocUtils';

async function createGoogleDocZip(files: Record<string, string>): Promise<Buffer> {
  const zip = new JSZip();

  for (const [fileName, contents] of Object.entries(files)) {
    zip.file(fileName, contents);
  }

  return zip.generateAsync({ type: 'nodebuffer' });
}

describe("convertImportedGoogleDoc", () => {
  it("inlines zipped HTML images as data URIs", async () => {
    const highResolutionImage = Buffer.from("high-resolution-image").toString("base64");
    const zipBuffer = await createGoogleDocZip({
      "index.html": '<html><body><img src="images/image1.jpg" /></body></html>',
      "images/image1.jpg": "high-resolution-image",
    });

    const html = await getGoogleDocZipHtml(zipBuffer);

    expect(html).toContain(`data:image/jpeg;base64,${highResolutionImage}`);
  });

  it("resolves image paths relative to the exported HTML file", async () => {
    const highResolutionImage = Buffer.from("nested-high-resolution-image").toString("base64");
    const zipBuffer = await createGoogleDocZip({
      "folder/export.html": '<html><body><img src="images/image1.jpg" /></body></html>',
      "folder/images/image1.jpg": "nested-high-resolution-image",
    });

    const html = await getGoogleDocZipHtml(zipBuffer);

    expect(html).toContain(`data:image/jpeg;base64,${highResolutionImage}`);
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
    const zipBuffer = await createGoogleDocZip({
      "index.html": htmlInput.replace(/\s+</g, '<'),
    });
    const htmlOutput = await convertImportedGoogleDoc({zipBuffer, postId: 'dummy'});
    expect(htmlOutput).toMatchSnapshot();
  });

  it("preserves bold and italic formatting from stylesheet classes", async () => {
    const htmlInput = `
      <html>
        <head>
          <style type="text/css">
            .c1{font-weight:700}
            .c2{font-style:italic}
            .c3{font-style:italic;font-weight:700}
          </style>
        </head>
        <body>
          <p>
            <span class="c1">bold</span>
            <span class="c2">italic</span>
            <span class="c3">both</span>
          </p>
        </body>
      </html>
    `;
    const zipBuffer = await createGoogleDocZip({
      "index.html": htmlInput.replace(/\s+</g, '<'),
    });

    const htmlOutput = await convertImportedGoogleDoc({ zipBuffer, postId: 'dummy' });

    expect(htmlOutput).toContain('<strong><span>bold</span></strong>');
    expect(htmlOutput).toContain('<i><span>italic</span></i>');
    expect(htmlOutput).toContain('<i><strong><span>both</span></strong></i>');
  });

  it("converts Google Docs footnotes to Lexical-compatible footnote markup", async () => {
    const htmlInput = `
      <html>
        <body>
          <p><span>Footnote</span><sup><a href="#ftnt1" id="ftnt_ref1">[1]</a></sup><span>.</span></p>
          <hr />
          <div><p><a href="#ftnt_ref1" id="ftnt1">[1]</a><span>&nbsp;Footnote one</span></p></div>
        </body>
      </html>
    `;
    const zipBuffer = await createGoogleDocZip({
      "index.html": htmlInput.replace(/\s+</g, '<'),
    });

    const htmlOutput = await convertImportedGoogleDoc({ zipBuffer, postId: 'dummy' });

    expect(htmlOutput).toContain('class="footnote-reference"');
    expect(htmlOutput).toContain('data-footnote-reference');
    expect(htmlOutput).toContain('role="doc-noteref"');
    expect(htmlOutput).toContain('<sup><a href="#fn');
    expect(htmlOutput).not.toContain('href="#ftnt1"');
    expect(htmlOutput).toContain('class="footnote-content" data-footnote-content');
    expect(htmlOutput).toContain('<span>Footnote one</span>');
  });

  it("removes empty paragraphs inside footnotes", async () => {
    const htmlInput = `
      <html>
        <body>
          <p><span>Footnote</span><sup><a href="#ftnt1" id="ftnt_ref1">[1]</a></sup></p>
          <hr />
          <div>
            <p><a href="#ftnt_ref1" id="ftnt1">[1]</a><span>&nbsp;First paragraph</span></p>
            <p><span></span></p>
            <p><span>Second paragraph</span></p>
          </div>
        </body>
      </html>
    `;
    const zipBuffer = await createGoogleDocZip({
      "index.html": htmlInput.replace(/\s+</g, '<'),
    });

    const htmlOutput = await convertImportedGoogleDoc({ zipBuffer, postId: 'dummy' });

    expect(htmlOutput).toContain('<span>First paragraph</span>');
    expect(htmlOutput).toContain('<span>Second paragraph</span>');
    expect(htmlOutput).not.toContain('<div class="footnote-content" data-footnote-content=""><p><span>First paragraph</span></p><p><span></span></p><p><span>Second paragraph</span></p></div>');
  });

  it("collapses each run of blank Google Docs spacer paragraphs by one", async () => {
    const htmlInput = `
      <html>
        <head>
          <style type="text/css">
            .c1{padding-top:0pt;padding-bottom:0pt;line-height:1.15}
            .c2{height:11pt}
            .c3{color:#000000;font-size:11pt;font-family:"Arial"}
          </style>
        </head>
        <body>
          <p class="c1"><span class="c3">First paragraph</span></p>
          <p class="c1 c2"><span class="c3"></span></p>
          <p class="c1 c2"><span class="c3"></span></p>
          <p class="c1 c2"><span class="c3"></span></p>
          <p class="c1"><span class="c3">Second paragraph</span></p>
        </body>
      </html>
    `;
    const zipBuffer = await createGoogleDocZip({
      "index.html": htmlInput.replace(/\s+</g, '<'),
    });

    const htmlOutput = await convertImportedGoogleDoc({ zipBuffer, postId: 'dummy' });
    const emptyParagraphMatches = htmlOutput.match(/<p><span><\/span><\/p>/g) ?? [];

    expect(htmlOutput).toContain('<span>First paragraph</span>');
    expect(htmlOutput).toContain('<span>Second paragraph</span>');
    expect(emptyParagraphMatches).toHaveLength(2);
  });
});
