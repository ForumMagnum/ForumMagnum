import { testStartup } from './testMain';
import chai from 'chai';
import { getCommentQuotedBlockID } from '../server/sideComments';

testStartup();

describe('side-comment blockquote matching', () => {
  it('finds exact-match blockquotes', () => {
    chai.assert.equal(
      getCommentQuotedBlockID(
        '<p id="firstParagraph">Lorem ipsum</p>'
        +'<p id="secondParagraph">dolor sit amet</p>',
        '<blockquote>Lorem ipsum</blockquote><p>asdf</p>'
      ),
      'firstParagraph'
    );
    chai.assert.equal(
      getCommentQuotedBlockID(
        '<p id="firstParagraph">Lorem ipsum</p>'
        +'<p id="secondParagraph">dolor sit amet</p>',
        '<blockquote>Lxxxm ixxxm</blockquote><p>asdf</p>'
      ),
      null
    );
  });
});

