import React from 'react';
import { render, shallow, mount, configure } from 'enzyme';
import { assert, should, expect } from 'meteor/practicalmeteor:chai';
import Adapter from 'enzyme-adapter-react-16';
import { sinon } from 'meteor/practicalmeteor:sinon';

configure({ adapter: new Adapter() })

import withNewEditor, { constructSlatePlugins } from './withNewEditor.jsx'
import slate, { defaultPlugins } from 'ory-editor-plugins-slate'

describe('withNewEditor', () => {
  it('replaces the default header-titles with 2 headers', () => {
    let slatePlugins = constructSlatePlugins(defaultPlugins)
    expect(slatePlugins[2].toolbarButtons).to.have.length(2);
  });
});
