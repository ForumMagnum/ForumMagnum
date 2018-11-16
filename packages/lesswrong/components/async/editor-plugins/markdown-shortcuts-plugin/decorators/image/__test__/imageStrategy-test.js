import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import Draft from 'draft-js';
import createImageStrategy from '../imageStrategy';

chai.use(sinonChai);

describe('imageStrategy', () => {
  const contentState = Draft.convertFromRaw({
    entityMap: {
      0: {
        type: 'IMG',
        mutability: 'IMMUTABLE',
        data: {
          alt: 'alt',
          src: 'http://cultofthepartyparrot.com/parrots/aussieparrot.gif',
          title: 'parrot'
        }
      }
    },
    blocks: [
      {
        key: 'dtehj',
        text: ' ',
        type: 'unstyled',
        depth: 0,
        inlineStyleRanges: [],
        entityRanges: [
          {
            offset: 0,
            length: 1,
            key: 0
          }
        ],
        data: {}
      }
    ]
  });
  it('callbacks range', () => {
    const block = contentState.getBlockForKey('dtehj');
    const strategy = createImageStrategy();
    const cb = sinon.spy();
    expect(block).to.be.an('object');
    strategy(block, cb, contentState);
    expect(cb).to.have.been.calledWith(0, 1);
  });
});
