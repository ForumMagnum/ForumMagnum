import React from 'react';
import { assert } from 'chai';
import { createShallow, getClasses } from '../test-utils';
import TableHead from './TableHead';

describe('<TableHead />', () => {
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    classes = getClasses(<TableHead>foo</TableHead>);
  });

  it('should render a thead', () => {
    const wrapper = shallow(<TableHead>foo</TableHead>);
    assert.strictEqual(wrapper.name(), 'thead');
  });

  it('should render a div', () => {
    const wrapper = shallow(<TableHead component="div">foo</TableHead>);
    assert.strictEqual(wrapper.name(), 'div');
  });

  it('should render with the user and root class', () => {
    const wrapper = shallow(<TableHead className="woofTableHead">foo</TableHead>);
    assert.strictEqual(wrapper.hasClass('woofTableHead'), true);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });

  it('should render children', () => {
    const children = <tr className="test" />;
    const wrapper = shallow(<TableHead>{children}</TableHead>);
    assert.strictEqual(wrapper.childAt(0).equals(children), true);
  });

  it('should define table.head in the child context', () => {
    const wrapper = shallow(<TableHead>foo</TableHead>);
    assert.strictEqual(wrapper.instance().getChildContext().tablelvl2.variant, 'head');
  });
});
