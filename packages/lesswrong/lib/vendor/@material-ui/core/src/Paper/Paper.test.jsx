import React from 'react';
import { assert } from 'chai';
import { createShallow, getClasses } from '../test-utils';
import Paper from './Paper';

describe('<Paper />', () => {
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    classes = getClasses(<Paper />);
  });

  it('should render a div', () => {
    const wrapper = shallow(<Paper>Hello World</Paper>);
    assert.strictEqual(wrapper.name(), 'div');
  });

  it('should render with the root class, default depth class', () => {
    const wrapper = shallow(<Paper>Hello World</Paper>);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
    assert.strictEqual(wrapper.hasClass(classes.rounded), true);
  });

  it('should disable the rounded class', () => {
    const wrapper = shallow(<Paper square>Hello World</Paper>);
    assert.strictEqual(wrapper.hasClass(classes.rounded), false);
  });

  it('should set the elevation elevation class', () => {
    const wrapper = shallow(<Paper elevation={16}>Hello World</Paper>);
    assert.strictEqual(
      wrapper.hasClass(classes.elevation16),
      true,
      'should have the 16 elevation class',
    );
    wrapper.setProps({ elevation: 24 });
    assert.strictEqual(
      wrapper.hasClass(classes.elevation24),
      true,
      'should have the 24 elevation class',
    );
    wrapper.setProps({ elevation: 2 });
    assert.strictEqual(
      wrapper.hasClass(classes.elevation2),
      true,
      'should have the 2 elevation class',
    );
  });

  describe('prop: component', () => {
    it('should render a header', () => {
      const wrapper = shallow(<Paper component="header">Hello World</Paper>);
      assert.strictEqual(wrapper.name(), 'header');
    });
  });
});
