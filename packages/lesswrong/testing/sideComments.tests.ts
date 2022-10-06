import { testStartup } from './testMain';
import chai from 'chai';
import { QuoteShardSettings, getCommentQuotedBlockID, commentToQuoteShards } from '../server/sideComments';

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

