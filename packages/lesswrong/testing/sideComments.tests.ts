import { testStartup } from './testMain';
import chai from 'chai';
import { QuoteShardSettings, getCommentQuotedBlockID, commentToQuoteShards, annotateMatchedSpans } from '../server/sideComments';

testStartup();

const testQuoteShardSettings: QuoteShardSettings = {
  minLength: 5,
};

describe('side-comment blockquote matching', () => {
  it('finds exact-match blockquotes', () => {
    chai.assert.equal(
      getCommentQuotedBlockID(
        '<div><p id="firstParagraph">Lorem ipsum</p>'
          + '<p id="secondParagraph">dolor sit amet</p></div>',
        '<div><blockquote>Lorem ipsum</blockquote><p>asdf</p></div>',
        testQuoteShardSettings
      ),
      'firstParagraph'
    );
    chai.assert.equal(
      getCommentQuotedBlockID(
        '<div><p id="firstParagraph">Lorem ipsum</p>'
          + '<p id="secondParagraph">dolor sit amet</p></div>',
        '<div><blockquote>Lxxxm ixxxm</blockquote><p>asdf</p></div>',
        testQuoteShardSettings
      ),
      null
    );
  });
  
  it('splits comments into quote shards', () => {
    // Split on paragraphs
    chai.assert.deepEqual(
      commentToQuoteShards("<blockquote><p>Lorem ipsum dolor sit amet</p><p>adipiscing lorem amor asdf dolor sit amet</p></blockquote>"),
      ["Lorem ipsum dolor sit amet", "adipiscing lorem amor asdf dolor sit amet"],
    );
    
    // Split on "..." (in various forms)
    const ellipsesVariants = ["...", " ... ", "\u2026", "[...]", "[\u2026]"];
    for (const ellipses of ellipsesVariants) {
      chai.assert.deepEqual(
        commentToQuoteShards("<blockquote>Lorem ipsum dolor sit amet"+ellipses+"adipiscing lorem amor asdf dolor sit amet</blockquote>"),
        ["Lorem ipsum dolor sit amet", "adipiscing lorem amor asdf dolor sit amet"],
      );
    }
    
    // Split on "[substituted word]"
    // TODO not implemented
    //for (const ellipses of ellipsesVariants) {
    //  chai.assert.deepEqual(
    //    commentToQuoteShards("<blockquote>The quick brown fox [Ahri] jumped over the lazy dog.</blockquote>", testQuoteShardSettings),
    //    ["The quick brown fox", "jumped over the lazy dog."]
    //  );
    //}
  });
  
  it('handles HTML inside quote shards', () => {
    chai.assert.deepEqual(
      commentToQuoteShards("<blockquote><p>Lorem <i>ipsum</i> dolor sit amet</p><p>adipiscing lorem amor asdf dolor sit amet</p></blockquote>"),
      ["Lorem <i>ipsum</i> dolor sit amet", "adipiscing lorem amor asdf dolor sit amet"],
    );
  });
});

describe('annotateMatchedSpans', () => {
  it('works inside a single text node', () => {
    chai.assert.equal(
      annotateMatchedSpans(
        '<p>Lorem ipsum <em>dolor</em> sit amet adipiscing</p>',
        [{start: 9, end: 10, spanClass: "c"}]
      ),
      '<p>Lorem <span class="c">i</span>psum <em>dolor</em> sit amet adipiscing</p>',
    );
  });
  // Disabled test: when a marked span crosses something entirely, we can avoid closing and reopening spans, saving some download size. But that's not currently implemented.
  /*it('works when enclosing an element', () => {
    chai.assert.equal(
      annotateMatchedSpans(
        '<p>Lorem ipsum <em>dolor</em> sit amet adipiscing</p>',
        [{start: 9, end: 33, spanClass: "c"}]
      ),
      '<p>Lorem <span class="c">ipsum <em>dolor</em> sit</span> amet adipiscing</p>',
    );
  });*/
  it('works when crossing into an element', () => {
    chai.assert.equal(
      annotateMatchedSpans(
        '<p>Lorem ipsum <em>dolor</em> sit amet adipiscing</p>',
        [{start: 9, end: 22, spanClass: "c"}]
      ),
      '<p>Lorem <span class="c">ipsum </span><em><span class="c">dol</span>or</em> sit amet adipiscing</p>',
    );
  });
  it('works when crossing out of an element', () => {
    chai.assert.equal(
      annotateMatchedSpans(
        '<p>Lorem ipsum <em>dolor</em> sit amet adipiscing</p>',
        [{start: 19, end: 33, spanClass: "c"}]
      ),
      '<p>Lorem ipsum <em><span class="c">dolor</span></em><span class="c"> sit</span> amet adipiscing</p>',
    );
  });
  it('works with multiple disjoint spans', () => {
    chai.assert.equal(
      annotateMatchedSpans(
        '<p>Lorem ipsum <em>dolor</em> sit amet adipiscing</p>',
        [
          {start: 9, end: 14, spanClass: "A"},
          {start: 34, end: 38, spanClass: "B"},
        ]
      ),
      '<p>Lorem <span class="A">ipsum</span> <em>dolor</em> sit <span class="B">amet</span> adipiscing</p>',
    );
  });
  it('works with partially overlapping spans', () => {
    chai.assert.equal(
      annotateMatchedSpans(
        '<p>Lorem ipsum <em>dolor</em> sit amet adipiscing</p>',
        [
          {start: 9, end: 33, spanClass: "A"},
          {start: 19, end: 38, spanClass: "B"},
        ]
      ),
      '<p>Lorem <span class="A">ipsum </span><em><span class="A B">dolor</span></em><span class="A B"> sit</span><span class="B"> amet</span> adipiscing</p>',
    );
  });
});
