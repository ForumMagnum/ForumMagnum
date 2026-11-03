import chai from 'chai';
import { truncatise } from "../lib/truncatise";

describe('truncatise', () => {
  it('truncates by word count', () => {
    chai.assert.equal(
      truncatise("one two three four five six", {
        TruncateLength: 3,
        Suffix: "..."
      }),
      "one two three..."
    );
  });
  it('truncates by paragraph count', () => {
    chai.assert.equal(
      truncatise("<p>one</p><p>two</p><p>three</p><p>four</p><p>five</p><p>six</p>", {
        TruncateLength: 3,
        TruncateBy: "paragraphs",
        Suffix: "..."
      }),
      "<p>one</p><p>two</p><p>three...</p>"
    );
  });
  it('closes open tags', () => {
    chai.assert.equal(
      truncatise("<p>one <b><a href=\"www.example.com\">two three four</a> five</b> six</p>", {
        TruncateLength: 3,
        Suffix: "..."
      }),
      '<p data-truncated="true">one <b data-truncated="true"><a data-truncated="true" href="www.example.com">two three</a></b>...</p>'
    );
  });
  it('ignores markup inside quoted attribute values', () => {
    chai.assert.equal(
      truncatise('<p><img alt="x><i><img src=x onerror=alert(1)>" src=\'a>b.png\'>one two three four</p>', {
        TruncateLength: 2,
        Suffix: "..."
      }),
      '<p data-truncated="true"><img alt="x><i><img src=x onerror=alert(1)>" src=\'a>b.png\'>one two...</p>'
    );
  });
});
