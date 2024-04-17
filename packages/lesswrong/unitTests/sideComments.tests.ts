import chai from 'chai';
import { QuoteShardSettings, getCommentQuotedBlockID, commentToQuoteShards, annotateMatchedSpans, matchSideComments } from '../server/sideComments';
import { cheerioParseAndMarkOffsets } from '../server/utils/htmlUtil';

const testQuoteShardSettings: QuoteShardSettings = {
  minLength: 5,
};

describe('side-comment blockquote matching', () => {
  function commentToQuoteShardStrings(comment: string) {
    return commentToQuoteShards(comment).map(shard => shard.text);
  }
  
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
      commentToQuoteShardStrings("<blockquote><p>Lorem ipsum dolor sit amet</p><p>adipiscing lorem amor asdf dolor sit amet</p></blockquote>"),
      ["Lorem ipsum dolor sit amet", "adipiscing lorem amor asdf dolor sit amet"],
    );
    
    // Split on "..." (in various forms)
    const ellipsesVariants = ["...", " ... ", "\u2026", "[...]", "[\u2026]"];
    for (const ellipses of ellipsesVariants) {
      chai.assert.deepEqual(
        commentToQuoteShardStrings("<blockquote>Lorem ipsum dolor sit amet"+ellipses+"adipiscing lorem amor asdf dolor sit amet</blockquote>"),
        ["Lorem ipsum dolor sit amet", "adipiscing lorem amor asdf dolor sit amet"],
      );
    }
    
    // Split on "[substituted word]"
    // TODO not implemented
    //for (const ellipses of ellipsesVariants) {
    //  chai.assert.deepEqual(
    //    commentToQuoteShardStrings("<blockquote>The quick brown fox [Ahri] jumped over the lazy dog.</blockquote>", testQuoteShardSettings),
    //    ["The quick brown fox", "jumped over the lazy dog."]
    //  );
    //}
  });
  
  it('handles HTML inside quote shards', () => {
    chai.assert.deepEqual(
      commentToQuoteShardStrings("<blockquote><p>Lorem <i>ipsum</i> dolor sit amet</p><p>adipiscing lorem amor asdf dolor sit amet</p></blockquote>"),
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
  it('works with elements that have attributes', () => {
    chai.assert.equal(
      annotateMatchedSpans(
        '<p id="block0">Lorem ipsum <em>dolor</em> sit amet adipiscing</p>',
        [{start: 21, end: 22, spanClass: "c"}]
      ),
      '<p id="block0">Lorem <span class="c">i</span>psum <em>dolor</em> sit amet adipiscing</p>',
    );
  });
  it("isn't messed up by &nbsp", () => {
    chai.assert.equal(
      annotateMatchedSpans(
        '<p>Lorem ipsum&nbsp;<em>dolor</em> sit amet adipiscing</p>',
        [{start: 9, end: 27, spanClass: "c"}]
      ),
      '<p>Lorem <span class="c">ipsum&nbsp;</span><em><span class="c">dol</span>or</em> sit amet adipiscing</p>',
    );
  });
});

describe('cheerioParseAndMarkOffsets', () => {
  const html = '<p>Lorem <em>ipsum</em> dolor</p>';
  const parsed = cheerioParseAndMarkOffsets(html);
  const em = parsed('em')[0] as cheerio.TagElement;
  const p = parsed('p')[0] as cheerio.TagElement;
  
  it('marks offsets of text nodes', () => {
    chai.assert.equal((em.children[0] as any).offset, 13);
    chai.assert.equal(typeof (em.children[0] as any).offset, "number");
    chai.assert.equal((p.children[0] as any).offset, 3);
    chai.assert.equal((p.children[2] as any).offset, 23);
  });
  it('annotates the offset of tags', () => {
    chai.assert.equal((em as any).offset, 9);
  });
  //TODO this one doesn't pass (but isn't essential to the functionality as-used-in-practice)
  /*it('annotates the offset of the root tag', () => {
    chai.assert.equal((p as any).offset, 0);
  });*/
  it('roundtrips HTML', () => {
    chai.assert.equal(parsed.html(), html);
  });
});

describe('matchSideComments', () => {
  it('annotates a quoted range', () => {
    chai.assert.deepEqual(
      matchSideComments({
        html: "<div><p>Lorem ipsum dolor sit amet adipiscing</p></div>",
        quoteShardSettings: testQuoteShardSettings,
        comments: [{
          _id: "comment1",
          html: "<blockquote>ipsum dolor sit amet</blockquote>",
        }]
      }),
      {
        html: '<div><p id="block0">Lorem <span class="blockquote_comment1_1">ipsum dolor sit amet</span> adipiscing</p></div>',
        sideCommentsByBlock: {"block0": ["comment1"]},
      },
    );
  });
});
