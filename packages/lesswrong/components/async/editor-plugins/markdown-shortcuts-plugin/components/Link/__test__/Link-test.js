import React from 'react';
import { ContentState } from 'draft-js';
import { shallow } from 'enzyme';
import chai, { expect } from 'chai';
import chaiEnzyme from 'chai-enzyme';

import Link from '../';

chai.use(chaiEnzyme());

describe('<Link />', () => {
  it('renders anchor tag', () => {
    const contentState = ContentState.createFromText('').createEntity('LINK', 'MUTABLE', {
      href: 'http://cultofthepartyparrot.com/',
      title: 'parrot'
    });
    const entityKey = contentState.getLastCreatedEntityKey();
    expect(
      shallow(<Link entityKey={entityKey} contentState={contentState}><b>Hello</b></Link>).html()
    ).to.equal(
      '<a href="http://cultofthepartyparrot.com/" title="parrot"><b>Hello</b></a>'
    );
  });
});
