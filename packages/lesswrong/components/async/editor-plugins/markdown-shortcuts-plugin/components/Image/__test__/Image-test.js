import React from 'react';
import { ContentState } from 'draft-js';
import { shallow } from 'enzyme';
import chai, { expect } from 'chai';
import chaiEnzyme from 'chai-enzyme';

import Image from '../';

chai.use(chaiEnzyme());

describe('<Image />', () => {
  it('renders anchor tag', () => {
    const contentState = ContentState.createFromText('').createEntity('IMG', 'MUTABLE', {
      alt: 'alt',
      src: 'http://cultofthepartyparrot.com/parrots/aussieparrot.gif',
      title: 'parrot'
    });
    const entityKey = contentState.getLastCreatedEntityKey();
    expect(
      shallow(<Image entityKey={entityKey} contentState={contentState}>&nbsp;</Image>).html()
    ).to.equal(
      '<span> <img src="http://cultofthepartyparrot.com/parrots/aussieparrot.gif" alt="alt" title="parrot"/></span>'
    );
  });
});
