import chai from 'chai';
import { diffHtml, trimHtmlDiff } from '../server/resolvers/htmlDiff';

describe('diffHtml', () => {
  it('passes unchanged HTML through', () => {
    const tests = [
      // Regular paragraphs, no common root
      '<p>First paragraph</p><p>Second <b>bold</b> paragraph</p>',
      // Regular paragraphs, wrapped in <body>
      '<body><p>Paragraph </p><p>Paragraph</p></body>',
    ];

    for (const testHtml of tests) {
      chai.assert.equal(normalizeHtml(diffHtml(testHtml, testHtml, false)), normalizeHtml(testHtml));
    }
  });

  it('represents changes with ins and del tags', () => {
    const tests = [
      // One word change, no wrapper
      {
        before: '<p>First paragraph</p><p>Second paragraph</p>',
        after: '<p>First paragraph</p><p>Another paragraph</p>',
        differences: '<p>First paragraph</p><p><del>Second</del><ins>Another</ins> paragraph</p>'
      },
      // One word change, wrapped in <body>
      {
        before: '<body><p>First paragraph</p><p>Second paragraph</p></body>',
        after: '<body><p>First paragraph</p><p>Another paragraph</p></body>',
        differences: '<body><p>First paragraph</p><p><del>Second</del><ins>Another</ins> paragraph</p></body>'
      },
      // Insert a paragraph
      {
        before: '<p>First paragraph</p><p>Last paragraph</p>',
        after: '<p>First paragraph</p><p>Inserted in the middle</p><p>Last paragraph</p>',
        differences: '<p>First paragraph</p><p><ins>Inserted in the middle</ins></p><p>Last paragraph</p>'
      },
    ];
    for (const testCase of tests) {
      chai.assert.equal(normalizeHtml(diffHtml(testCase.before, testCase.after, false)), normalizeHtml(testCase.differences));
    }
  });

  it('sanitizes results', () => {
    const scriptTag = '<script>alert("xss")</script>'
    const before = scriptTag+'<p>First paragraph</p><p>Last paragraph</p>'
    const after = scriptTag+'<p>First paragraph</p><p>Inserted paragraph</p><p>Last paragraph</p>'
    const differences = '<p>First paragraph</p><p><ins>Inserted paragraph</ins></p><p>Last paragraph</p>'
    chai.assert.equal(normalizeHtml(diffHtml(before, after, false)), normalizeHtml(differences));
  });

  it('trims unchanged sections correctly', () => {
    const tests = [
      {
        untrimmed: '<p>This paragraph is not changed</p><p><ins>This is inserted</ins></p><p><del>This is deleted</del></p>',
        trimmed: '<p><ins>This is inserted</ins></p><p><del>This is deleted</del></p>',
      },
      {
        untrimmed: '<body><p>First paragraph</p><p>Second paragraph</p></body>',
        trimmed: '<body></body>'
      },
    ];
    for (const testCase of tests) {
      chai.assert.equal(normalizeHtml(trimHtmlDiff(testCase.untrimmed)), normalizeHtml(testCase.trimmed));
    }
  });
});

// Normalize HTML for comparison in these tests. Checks whether it's wrapped in
// <body>. If it is, return it unchanged; otherwise wrap it.
function normalizeHtml(html: string): string {
  if (html.startsWith('<body>')) return html;
  else return '<body>'+html+'</body>';
}
