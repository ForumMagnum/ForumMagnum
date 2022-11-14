import chai from 'chai';
import { htmlStartingAtHash } from '../server/extractHighlights';

describe('extractHighlights', () => {
  it('finds the indicated section', () => {
    chai.assert.equal(
      htmlStartingAtHash(
        '<div><p>Asdf ghjk</p><p id="section1">Lorem ipsum</p></div>',
        "section1"
      ),
      '<div><p id="section1">Lorem ipsum</p></div>'
    );
  });
  it("is a no-op if the requested section doesn't exist", () => {
    chai.assert.equal(
      htmlStartingAtHash(
        '<div><p>Asdf ghjk</p><p id="section1">Lorem ipsum</p></div>',
        "section2"
      ),
      '<div><p>Asdf ghjk</p><p id="section1">Lorem ipsum</p></div>'
    );
  });
});
