import chai from 'chai';
import { truncateWithGrace } from "../lib/editor/ellipsize";

describe('truncateWithGrace', () => {
  it('counts the words left as the words not shown', () => {
    const words = Array.from({ length: 100 }, (_, i) => `word${i}`);
    const { truncatedHtml, wordsLeft } = truncateWithGrace(`<p>${words.join(" ")}</p>`, 40, 0, words.length);
    const shownWordCount = truncatedHtml.replace(/<[^>]*>|\.\.\./g, "").trim().split(/\s+/).length;
    chai.assert.equal(wordsLeft, words.length - shownWordCount);
  });
});
