import React from 'react';
import { assert } from 'chai';
import { spy } from 'sinon';
import { createShallow, getClasses } from '../test-utils';
import Icon from '../Icon';
import BottomNavigationAction from './BottomNavigationAction';

describe('<BottomNavigationAction />', () => {
  let shallow;
  let classes;
  const icon = <Icon>restore</Icon>;

  before(() => {
    shallow = createShallow({ dive: true });
    classes = getClasses(<BottomNavigationAction />);
  });

  it('should render a ButtonBase', () => {
    shallow(<BottomNavigationAction icon={icon} />);
  });

  it('should render with the root class', () => {
    const wrapper = shallow(<BottomNavigationAction icon={icon} />);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });

  it('should render with the user and root classes', () => {
    const wrapper = shallow(
      <BottomNavigationAction className="woofBottomNavigationAction" icon={icon} />,
    );
    assert.strictEqual(wrapper.hasClass('woofBottomNavigationAction'), true);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });

  it('should render with the selected and root classes', () => {
    const wrapper = shallow(<BottomNavigationAction icon={icon} selected />);
    assert.strictEqual(wrapper.hasClass(classes.selected), true);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });

  it('should render with the selectedIconOnly and root classes', () => {
    const wrapper = shallow(<BottomNavigationAction icon={icon} showLabel={false} />);
    assert.strictEqual(wrapper.hasClass(classes.iconOnly), true);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });

  it('should render icon', () => {
    const wrapper = shallow(<BottomNavigationAction icon={icon} />);
    assert.strictEqual(wrapper.contains(icon), true);
  });

  it('should render label with the selected class', () => {
    const wrapper = shallow(<BottomNavigationAction icon={icon} selected />);
    const labelWrapper = wrapper.childAt(0).childAt(1);
    assert.strictEqual(labelWrapper.hasClass(classes.selected), true);
    assert.strictEqual(labelWrapper.hasClass(classes.label), true);
  });

  it('should render label with the iconOnly class', () => {
    const wrapper = shallow(<BottomNavigationAction icon={icon} showLabel={false} />);
    const labelWrapper = wrapper.childAt(0).childAt(1);
    assert.strictEqual(
      labelWrapper.hasClass(classes.iconOnly),
      true,
      'should have the iconOnly class',
    );
    assert.strictEqual(labelWrapper.hasClass(classes.label), true);
  });

  it('should not render an Icon if icon is not provided', () => {
    const wrapper = shallow(<BottomNavigationAction />);
    assert.strictEqual(wrapper.find(Icon).exists(), false);
  });

  describe('prop: onClick', () => {
    it('should be called when a click is triggered', () => {
      const handleClick = spy();
      const wrapper = shallow(
        <BottomNavigationAction icon="book" onClick={handleClick} value="foo" />,
      );
      wrapper.simulate('click', 'bar');
      assert.strictEqual(handleClick.callCount, 1);
    });
  });

  describe('prop: onChange', () => {
    it('should be called when a click is triggered', () => {
      const handleChange = spy();
      const wrapper = shallow(
        <BottomNavigationAction icon="book" onChange={handleChange} value="foo" />,
      );
      wrapper.simulate('click', 'bar');
      assert.strictEqual(handleChange.callCount, 1);
    });
  });
});
