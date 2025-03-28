import { convertImportedGoogleDoc } from '@/server/editor/conversionUtils';

describe("convertImportedGoogleDoc", () => {

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
