import React from 'react';
import { assert } from 'chai';
import { createShallow, createMount, getClasses } from '../test-utils';
import TableSortLabel from './TableSortLabel';
import Sort from '@/lib/vendor/@material-ui/icons/src/Sort';

describe('<TableSortLabel />', () => {
  let shallow;
  let mount;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    mount = createMount();
    classes = getClasses(<TableSortLabel />);
  });

  after(() => {
    mount.cleanUp();
  });

  it('should render TableSortLabel', () => {
    const wrapper = shallow(<TableSortLabel />);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });

  it('should set the active class when active', () => {
    const activeFlag = true;
    const wrapper = shallow(<TableSortLabel active={activeFlag} />);
    assert.strictEqual(wrapper.hasClass(classes.active), true);
  });

  it('should not set the active class when not active', () => {
    const activeFlag = false;
    const wrapper = shallow(<TableSortLabel active={activeFlag} />);
    assert.strictEqual(wrapper.hasClass(classes.active), false);
  });

  describe('has an icon', () => {
    it('should have one child with the icon class', () => {
      const wrapper = shallow(<TableSortLabel />);
      const iconChildren = wrapper.find(`.${classes.icon}`);
      assert.strictEqual(iconChildren.length, 1);
    });

    it('by default should have desc direction class', () => {
      const wrapper = shallow(<TableSortLabel />);
      const icon = wrapper.find(`.${classes.icon}`).first();
      assert.strictEqual(icon.hasClass(classes.iconDirectionAsc), false);
      assert.strictEqual(icon.hasClass(classes.iconDirectionDesc), true);
    });

    it('when given direction desc should have desc direction class', () => {
      const wrapper = shallow(<TableSortLabel direction="desc" />);
      const icon = wrapper.find(`.${classes.icon}`).first();
      assert.strictEqual(icon.hasClass(classes.iconDirectionAsc), false);
      assert.strictEqual(icon.hasClass(classes.iconDirectionDesc), true);
    });

    it('when given direction asc should have asc direction class', () => {
      const wrapper = shallow(<TableSortLabel direction="asc" />);
      const icon = wrapper.find(`.${classes.icon}`).first();
      assert.strictEqual(icon.hasClass(classes.iconDirectionAsc), true);
      assert.strictEqual(icon.hasClass(classes.iconDirectionDesc), false);
    });

    it('should accept a custom icon for the sort icon', () => {
      const wrapper = mount(<TableSortLabel IconComponent={Sort} />);
      assert.strictEqual(wrapper.props().IconComponent, Sort);
      assert.strictEqual(wrapper.find(Sort).length, 1);
    });
  });

  describe('prop: hideSortIcon', () => {
    it('can hide icon when not active', () => {
      const wrapper = shallow(<TableSortLabel active={false} hideSortIcon />);
      const iconChildren = wrapper.find(`.${classes.icon}`).first();
      assert.strictEqual(iconChildren.length, 0);
    });

    it('does not hide icon by default when not active', () => {
      const wrapper = shallow(<TableSortLabel active={false} />);
      const iconChildren = wrapper.find(`.${classes.icon}`).first();
      assert.strictEqual(iconChildren.length, 1);
    });

    it('does not hide icon when active', () => {
      const wrapper = shallow(<TableSortLabel active hideSortIcon />);
      const iconChildren = wrapper.find(`.${classes.icon}`).first();
      assert.strictEqual(iconChildren.length, 1);
    });
  });

  describe('mount', () => {
    it('should mount without error', () => {
      mount(<TableSortLabel />);
    });
  });
});
