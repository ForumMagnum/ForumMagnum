/* eslint-disable no-underscore-dangle */

import React from 'react';
import { assert } from 'chai';
import { spy, useFakeTimers } from 'sinon';
import consoleErrorMock from 'test/utils/consoleErrorMock';
import { createShallow, createMount, getClasses, unwrap } from '../test-utils';
import Popper from '../Popper';
import Tooltip from './Tooltip';
import createMuiTheme from '../styles/createMuiTheme';

function persist() {}

const TooltipNaked = unwrap(Tooltip);
const theme = createMuiTheme();

describe('<Tooltip />', () => {
  let shallow;
  let mount;
  let classes;
  let clock;
  const defaultProps = {
    title: 'Hello World',
    children: <span>Hello World</span>,
  };

  before(() => {
    shallow = createShallow({ dive: true, disableLifecycleMethods: true });
    mount = createMount();
    classes = getClasses(<Tooltip {...defaultProps} />);
    clock = useFakeTimers();
  });

  after(() => {
    clock.restore();
    mount.cleanUp();
  });

  it('should render the correct structure', () => {
    const wrapper = shallow(<Tooltip {...defaultProps} />);
    assert.strictEqual(wrapper.type(), React.Fragment);
    assert.strictEqual(wrapper.childAt(0).name(), 'RootRef');
    assert.strictEqual(wrapper.childAt(1).name(), 'WithTheme(Popper)');
    assert.strictEqual(wrapper.childAt(1).hasClass(classes.popper), true);
  });

  describe('prop: title', () => {
    it('should display if the title is presetn', () => {
      const wrapper = shallow(<Tooltip {...defaultProps} open />);
      assert.strictEqual(wrapper.find(Popper).props().open, true);
    });

    it('should not display if the title is an empty string', () => {
      const wrapper = shallow(<Tooltip {...defaultProps} title="" open />);
      assert.strictEqual(wrapper.find(Popper).props().open, false);
    });
  });

  describe('prop: placement', () => {
    it('should have top placement', () => {
      const wrapper = shallow(<Tooltip {...defaultProps} placement="top" />);
      assert.strictEqual(wrapper.find(Popper).props().placement, 'top');
    });
  });

  it('should respond to external events', () => {
    const wrapper = shallow(<Tooltip {...defaultProps} />);
    wrapper.instance().childrenRef = document.createElement('div');
    const children = wrapper.childAt(0).childAt(0);
    assert.strictEqual(wrapper.state().open, false);
    children.simulate('mouseOver', { type: 'mouseover' });
    assert.strictEqual(wrapper.state().open, true);
    children.simulate('mouseLeave', { type: 'mouseleave' });
    assert.strictEqual(wrapper.state().open, false);
  });

  it('should be controllable', () => {
    const handleRequestOpen = spy();
    const handleClose = spy();

    const wrapper = shallow(
      <Tooltip {...defaultProps} open onOpen={handleRequestOpen} onClose={handleClose} />,
    );
    wrapper.instance().childrenRef = document.createElement('div');
    const children = wrapper.childAt(0).childAt(0);
    assert.strictEqual(handleRequestOpen.callCount, 0);
    assert.strictEqual(handleClose.callCount, 0);
    children.simulate('mouseOver', { type: 'mouseover' });
    assert.strictEqual(handleRequestOpen.callCount, 1);
    assert.strictEqual(handleClose.callCount, 0);
    children.simulate('mouseLeave', { type: 'mouseleave' });
    assert.strictEqual(handleRequestOpen.callCount, 1);
    assert.strictEqual(handleClose.callCount, 1);
  });

  it('should close when the interaction is over', () => {
    const wrapper = shallow(<Tooltip {...defaultProps} />);
    const childrenRef = document.createElement('div');
    childrenRef.tabIndex = 0;
    wrapper.instance().childrenRef = childrenRef;
    const children = wrapper.childAt(0).childAt(0);
    assert.strictEqual(wrapper.state().open, false);
    children.simulate('mouseOver', { type: 'mouseover' });
    childrenRef.focus();
    children.simulate('focus', { type: 'focus', persist });
    clock.tick(0);
    assert.strictEqual(wrapper.state().open, true);
    children.simulate('mouseLeave', { type: 'mouseleave' });
    assert.strictEqual(wrapper.state().open, false);
    children.simulate('blur', { type: 'blur' });
    assert.strictEqual(wrapper.state().open, false);
  });

  describe('touch screen', () => {
    it('should not respond to quick events', () => {
      const wrapper = shallow(<Tooltip {...defaultProps} />);
      const childrenRef = document.createElement('div');
      childrenRef.tabIndex = 0;
      wrapper.instance().childrenRef = childrenRef;
      const children = wrapper.childAt(0).childAt(0);
      children.simulate('touchStart', { type: 'touchstart', persist });
      children.simulate('touchEnd', { type: 'touchend', persist });
      childrenRef.focus();
      children.simulate('focus', { type: 'focus', persist });
      assert.strictEqual(wrapper.state().open, false);
    });

    it('should open on long press', () => {
      const wrapper = shallow(<Tooltip {...defaultProps} />);
      const childrenRef = document.createElement('div');
      childrenRef.tabIndex = 0;
      wrapper.instance().childrenRef = childrenRef;
      const children = wrapper.childAt(0).childAt(0);
      children.simulate('touchStart', { type: 'touchstart', persist });
      childrenRef.focus();
      children.simulate('focus', { type: 'focus', persist });
      clock.tick(1e3);
      assert.strictEqual(wrapper.state().open, true);
      children.simulate('touchEnd', { type: 'touchend', persist });
      children.simulate('blur', { type: 'blur' });
      clock.tick(1500);
      assert.strictEqual(wrapper.state().open, false);
    });
  });

  describe('mount', () => {
    it('should mount without any issue', () => {
      mount(<Tooltip {...defaultProps} open />);
    });
  });

  describe('prop: delay', () => {
    it('should take the enterDelay into account', () => {
      const wrapper = mount(
        <TooltipNaked classes={{}} theme={theme} enterDelay={111} {...defaultProps} />,
      );
      const childrenRef = wrapper.instance().childrenRef;
      childrenRef.tabIndex = 0;
      childrenRef.focus();
      assert.strictEqual(document.activeElement, childrenRef);
      assert.strictEqual(wrapper.state().open, false);
      clock.tick(111);
      assert.strictEqual(wrapper.state().open, true);
    });

    it('should take the leaveDelay into account', () => {
      const wrapper = mount(
        <TooltipNaked classes={{}} theme={theme} leaveDelay={111} {...defaultProps} />,
      );
      const childrenRef = wrapper.instance().childrenRef;
      childrenRef.tabIndex = 0;
      childrenRef.focus();
      assert.strictEqual(document.activeElement, childrenRef);
      clock.tick(0);
      assert.strictEqual(wrapper.state().open, true);
      childrenRef.blur();
      assert.strictEqual(wrapper.state().open, true);
      clock.tick(111);
      assert.strictEqual(wrapper.state().open, false);
    });
  });

  describe('prop: overrides', () => {
    [
      'onTouchStart',
      'onTouchEnd',
      'onMouseEnter',
      'onMouseOver',
      'onMouseLeave',
      'onFocus',
      'onBlur',
    ].forEach(name => {
      it(`should be transparent for the ${name} event`, () => {
        const handler = spy();
        const wrapper = shallow(
          <Tooltip title="Hello World">
            <button type="submit" {...{ [name]: handler }}>
              Hello World
            </button>
          </Tooltip>,
        );
        wrapper.instance().childrenRef = document.createElement('div');
        const children = wrapper.childAt(0).childAt(0);
        const type = name.slice(2).toLowerCase();
        children.simulate(type, { type, persist });
        clock.tick(0);
        assert.strictEqual(handler.callCount, 1);
      });
    });
  });

  describe('disabled button warning', () => {
    before(() => {
      consoleErrorMock.spy();
    });

    after(() => {
      consoleErrorMock.reset();
    });

    it('should raise a warning when we can listen to events', () => {
      mount(
        <Tooltip title="Hello World">
          <button type="submit" disabled>
            Hello World
          </button>
        </Tooltip>,
      );
      assert.strictEqual(consoleErrorMock.callCount(), 1, 'should call console.error');
      assert.match(
        consoleErrorMock.args()[0][0],
        /Material-UI: you are providing a disabled `button` child to the Tooltip component/,
      );
    });
  });
});
