import React from 'react';
import { useFakeTimers } from 'sinon';
import { assert } from 'chai';
import { createShallow, createMount, getClasses, unwrap } from '../test-utils';
import TouchRipple, { DELAY_RIPPLE } from './TouchRipple';

const cb = () => {};

describe('<TouchRipple />', () => {
  let shallow;
  let mount;
  let classes;
  const TouchRippleNaked = unwrap(TouchRipple);

  before(() => {
    shallow = createShallow({ dive: true });
    mount = createMount();
    classes = getClasses(<TouchRipple />);
  });

  after(() => {
    mount.cleanUp();
  });

  it('should render a <ReactTransitionGroup> component', () => {
    const wrapper = shallow(<TouchRipple />);
    assert.strictEqual(wrapper.name(), 'TransitionGroup');
    assert.strictEqual(wrapper.props().component, 'span');
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });

  it('should render the custom className', () => {
    const wrapper = shallow(<TouchRipple className="test-class-name" />);
    assert.strictEqual(wrapper.is('.test-class-name'), true);
  });

  describe('prop: center', () => {
    it('should should compute the right ripple dimensions', () => {
      const wrapper = shallow(<TouchRipple center />);
      const instance = wrapper.instance();
      instance.start(
        {},
        {
          fakeElement: true,
        },
        cb,
      );
      wrapper.update();
      assert.strictEqual(wrapper.childAt(0).props().rippleSize, 1);
    });
  });

  it('should create individual ripples', () => {
    const wrapper = mount(<TouchRippleNaked classes={{}} />);
    const instance = wrapper.instance();

    assert.strictEqual(wrapper.state().ripples.length, 0);

    instance.start({ clientX: 0, clientY: 0 }, cb);
    assert.strictEqual(wrapper.state().ripples.length, 1);

    instance.start({ clientX: 0, clientY: 0 }, cb);
    assert.strictEqual(wrapper.state().ripples.length, 2);

    instance.start({ clientX: 0, clientY: 0 }, cb);
    assert.strictEqual(wrapper.state().ripples.length, 3);

    instance.stop({ type: 'mouseup' });
    assert.strictEqual(wrapper.state().ripples.length, 2);

    instance.stop({ type: 'mouseup' });
    assert.strictEqual(wrapper.state().ripples.length, 1);

    instance.stop({ type: 'mouseup' });
    assert.strictEqual(wrapper.state().ripples.length, 0);
  });

  describe('creating unique ripples', () => {
    it('should create a ripple', () => {
      const wrapper = shallow(<TouchRipple />);
      const instance = wrapper.instance();
      instance.start(
        {},
        {
          pulsate: true,
          fakeElement: true,
        },
        cb,
      );
      assert.strictEqual(wrapper.state().ripples.length, 1);
    });

    it('should ignore a mousedown event', () => {
      const wrapper = shallow(<TouchRipple />);
      const instance = wrapper.instance();
      instance.ignoringMouseDown = true;
      instance.start({ type: 'mousedown' }, cb);
      assert.strictEqual(wrapper.state().ripples.length, 0);
    });

    it('should set ignoringMouseDown to true', () => {
      const wrapper = shallow(<TouchRipple />);
      const instance = wrapper.instance();
      assert.strictEqual(instance.ignoringMouseDown === true, false);
      instance.start({ type: 'touchstart' }, { fakeElement: true }, cb);
      assert.strictEqual(wrapper.state().ripples.length, 1);
      assert.strictEqual(instance.ignoringMouseDown, true);
    });

    it('should create a specific ripple', () => {
      const wrapper = shallow(<TouchRipple />);
      const instance = wrapper.instance();
      const clientX = 1;
      const clientY = 1;
      instance.start({ clientX, clientY }, { fakeElement: true }, cb);
      assert.strictEqual(wrapper.state().ripples.length, 1);
      assert.strictEqual(wrapper.state().ripples[0].props.rippleX, clientX);
      assert.strictEqual(wrapper.state().ripples[0].props.rippleY, clientY);
    });
  });

  describe('mobile', () => {
    let clock;

    before(() => {
      clock = useFakeTimers();
    });

    after(() => {
      clock.restore();
    });

    it('should delay the display of the ripples', () => {
      const wrapper = shallow(<TouchRipple />);
      const instance = wrapper.instance();

      assert.strictEqual(wrapper.state().ripples.length, 0);
      instance.start({ touches: [], clientX: 0, clientY: 0 }, { fakeElement: true }, cb);
      assert.strictEqual(wrapper.state().ripples.length, 0);

      clock.tick(DELAY_RIPPLE);
      assert.strictEqual(wrapper.state().ripples.length, 1);

      clock.tick(DELAY_RIPPLE);
      instance.stop({ type: 'touchend' }, cb);
      assert.strictEqual(wrapper.state().ripples.length, 0);
    });

    it('should trigger the ripple for short touch interactions', () => {
      const wrapper = shallow(<TouchRipple />);
      const instance = wrapper.instance();

      assert.strictEqual(wrapper.state().ripples.length, 0);
      instance.start({ touches: [], clientX: 0, clientY: 0 }, { fakeElement: true }, cb);
      assert.strictEqual(wrapper.state().ripples.length, 0);

      clock.tick(DELAY_RIPPLE / 2);
      assert.strictEqual(wrapper.state().ripples.length, 0);
      instance.stop({ type: 'touchend', persist: () => {} }, cb);
      assert.strictEqual(wrapper.state().ripples.length, 1);

      clock.tick(1);
      assert.strictEqual(wrapper.state().ripples.length, 0);
    });

    it('should interupt the ripple schedule', () => {
      const wrapper = shallow(<TouchRipple />);
      const instance = wrapper.instance();

      assert.strictEqual(wrapper.state().ripples.length, 0);
      instance.start({ touches: [], clientX: 0, clientY: 0 }, { fakeElement: true }, cb);
      assert.strictEqual(wrapper.state().ripples.length, 0);

      clock.tick(DELAY_RIPPLE / 2);
      assert.strictEqual(wrapper.state().ripples.length, 0);

      instance.stop({ type: 'touchmove' });
      clock.tick(DELAY_RIPPLE);
      assert.strictEqual(wrapper.state().ripples.length, 0);
    });
  });
});
