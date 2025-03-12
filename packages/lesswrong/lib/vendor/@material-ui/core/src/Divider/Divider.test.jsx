import React from 'react';
import { assert } from 'chai';
import { createShallow, getClasses } from '../test-utils';
import Divider from './Divider';

describe('<Divider />', () => {
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    classes = getClasses(<Divider />);
  });

  it('should render a hr', () => {
    const wrapper = shallow(<Divider />);
    assert.strictEqual(wrapper.name(), 'hr');
  });

  it('should render with the root and default class', () => {
    const wrapper = shallow(<Divider />);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });

  it('should set the absolute class', () => {
    const wrapper = shallow(<Divider absolute />);
    assert.strictEqual(wrapper.hasClass(classes.absolute), true);
  });

  it('should set the inset class', () => {
    const wrapper = shallow(<Divider inset />);
    assert.strictEqual(wrapper.hasClass(classes.inset), true);
  });

  it('should set the light class', () => {
    const wrapper = shallow(<Divider light />);
    assert.strictEqual(wrapper.hasClass(classes.light), true);
  });
});
