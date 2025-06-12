import { extractTableOfContents } from "../lib/tableOfContents";
import { parseDocumentFromString } from "../lib/domParser";

const normalizeHtml = (html: string) => html.replace(/[\s\n]+/g, " ").trim();

/*
 * Note: these tests use &#160; rather than &nbsp; (these are the same) because
 * 'linkedom' normalizes them to &#160. Which is a little unfortunate, since
 * that name is less legible, but oh well.
 */

describe("extractTableOfContents", () => {
  it("handles a basic case correctly", () => {
    const html = normalizeHtml(`
      <h1>Title</h1>
      <p>Some content here</p>
      <h2>Subtitle</h2>
      <strong>Bold level 3 heading</strong>
      <h2>Subtitle 2</h2>
      <h3>Level 3 heading</h3>
      <p>More content here</p>
    `);
    const { document, window } = parseDocumentFromString(html);
    const tocData = extractTableOfContents({ document, window });
    expect(tocData).toEqual({
      html: normalizeHtml(`
        <h1 id="Title">Title</h1>
        <p>Some content here</p>
        <h2 id="Subtitle">Subtitle</h2>
        <strong>Bold level 3 heading</strong>
        <h2 id="Subtitle_2">Subtitle 2</h2>
        <h3 id="Level_3_heading">Level 3 heading</h3>
        <p>More content here</p>
      `),
      sections: [
        { title: "Title", anchor: "Title", level: 1 },
        { title: "Subtitle", anchor: "Subtitle", level: 2 },
        { title: "Subtitle 2", anchor: "Subtitle_2", level: 2 },
        { title: "Level 3 heading", anchor: "Level_3_heading", level: 3 },
        { anchor: "postHeadingsDivider", divider: true, level: 0 },
      ],
    });
  });

  it("returns null for empty HTML", () => {
    const html = "";
    const { document, window } = parseDocumentFromString(html);
    const tocData = extractTableOfContents({ document, window });
    expect(tocData).toBeNull();
  });

  it("Regression: Nested <strong> tags should not be counted as headings", () => {
    // In the previous (cheerio-based) implementation these all contained a <strong> tag that was counted as a heading.
    // I think these were all wrong, so in the DOM-based I'm asserting that these don't result in headings. There are some
    // cases like this I think it would be good to support though, E.g. I think <p><strong>Visit our </strong><a href="..."><strong>website</strong></a>
    // should be counted as a heading.
    const cases = [
      normalizeHtml(`<p><strong>Here is some additional content (</strong><a href="https://www.youtube.com/watch?v=S7Cu59G1aSQ&t=76s"><strong>11 min video</strong></a><strong>) to consider about if you are the right fit for founding.</strong></p>`),
      normalizeHtml(`<p><a href="https://www.visitdubai.com/en/plan-your-trip/visa-information"><strong>Dubai Visa Information</strong></a><br><br><strong>Why is it such short notice?</strong></p>`),
      normalizeHtml(`
        <blockquote>
          <p><strong>Also Read: </strong><a href="https://worlegram.com/read-blog/108231_learn-why-8gb-laptops-are-top-picks-in-the-market.html"><strong>Learn Why 8GB Laptops Are Top Picks in the Market</strong></a><br>&#160;</p>
        </blockquote>
      `),
      normalizeHtml(`
        <p><br>&#160;<strong>Please submit your ideas here:&#160;</strong><a href="https://docs.google.com/forms/d/e/1FAIpQLSf7yo1Bd4ZK6_u2nziuM_10bYYoJhAMjp-9b_MKG2tMX9PuWA/viewform"><strong><u>Submit your ideas</u></strong></a></p>
      `),
      normalizeHtml('<p><strong>Animal advocacy organisations&#160;</strong><a href="https://www.animaladvocacycareers.org/post/animal-advocacy-bottlenecks"><strong><u>listed</u></strong></a><strong> a lack of funding as the single most important thing that limited their organisations impact.</strong></p>'),
      normalizeHtml('<p><strong>&#160;</strong><a href="https://genericaura.com/product/careprost-eye-drops/"><strong>Careprost</strong></a><strong> is an FDA-approved medicine that is used all over the world to reduce ocular blood pressure.&#160;</strong></p>'),
      normalizeHtml('<p><strong>Click Here To Know More Info:&#160;</strong><a href="https://www.osiztechnologies.com/ai-development-company"><strong><u>https://www.osiztechnologies.com/ai-development-company</u></strong></a></p>'),
      normalizeHtml('<p><strong>Read More :-&#160;</strong><a href="https://getairlineshelpdesk.com/blog/united-airlines-flight-status"><strong><u>United Airlines Flight Status</u></strong></a></p>')
    ];

    for (const html of cases) {
      const { document, window } = parseDocumentFromString(html);
      const tocData = extractTableOfContents({ document, window });
      expect(tocData).toEqual({
        html,
        sections: [],
      });
    }
  });

  it("Regression: <strong> inside <i> (should count as a heading)", () => {
    const html = normalizeHtml(`
      <p><i><strong>Bold and italic</strong></i></p>
    `);
    const { document, window } = parseDocumentFromString(html);
    const tocData = extractTableOfContents({ document, window });
    expect(tocData).toEqual({
      html: normalizeHtml(`
        <p><i><strong id="Bold_and_italic">Bold and italic</strong></i></p>
      `),
      sections: [
        { title: "Bold and italic", anchor: "Bold_and_italic", level: 1 },
        { anchor: "postHeadingsDivider", divider: true, level: 0 },
      ],
    });
  });

  it("Regression: <i> inside <strong> (should count as a heading)", () => {
    const html = normalizeHtml(`
      <p><strong><i>Italic and bold</i></strong></p>
    `);
    const { document, window } = parseDocumentFromString(html);
    const tocData = extractTableOfContents({ document, window });
    expect(tocData).toEqual({
      html: normalizeHtml(`
        <p><strong id="Italic_and_bold"><i>Italic and bold</i></strong></p>
      `),
      sections: [
        { title: "Italic and bold", anchor: "Italic_and_bold", level: 1 },
        { anchor: "postHeadingsDivider", divider: true, level: 0 },
      ],
    });
  });

  it("Regression: Trailing whitespace counts towards anchor", () => {
    const html = `<p><strong>DanielFilan ($23,544):&#160; Funding to produce 12 more AXRP episodes, the AI X-risk Podcast.&#160; </strong></p>`;

    const expectedAnchor = "DanielFilan___23_544____Funding_to_produce_12_more_AXRP_episodes__the_AI_X_risk_Podcast___"

    const { document, window } = parseDocumentFromString(html);
    const tocData = extractTableOfContents({ document, window });
    expect(tocData).toEqual({
      html: `<p><strong id="${expectedAnchor}">DanielFilan ($23,544):&#160; Funding to produce 12 more AXRP episodes, the AI X-risk Podcast.&#160; </strong></p>`,
      sections: [
        {
          title: "DanielFilan ($23,544):  Funding to produce 12 more AXRP episodes, the AI X-risk Podcast.  ",
          anchor: expectedAnchor,
          level: 1,
        },
        { anchor: "postHeadingsDivider", divider: true, level: 0 },
      ],
    });
  });
  it("excludes headings inside footnotes", () => {
    const html = normalizeHtml(`
      <h1>Title</h1>
      <p>Some content here</p>
      <div class="footnotes">
      <ol>
      <li>
      <h2>A heading inside a footnote</h2>
      </li>
      </ol>
      </div>
    `);
    const { document, window } = parseDocumentFromString(html);
    const tocData = extractTableOfContents({ document, window });
    expect(tocData).toEqual({
      html: normalizeHtml(`
        <h1 id="Title">Title</h1>
        <p>Some content here</p>
        <div class="footnotes">
        <ol>
        <li>
        <h2>A heading inside a footnote</h2>
        </li>
        </ol>
        </div>
      `),
      sections: [
        { title: "Title", anchor: "Title", level: 1 },
        { anchor: "postHeadingsDivider", divider: true, level: 0 },
      ],
    });
  });
});
