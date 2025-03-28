import React from 'react';
import { assert } from 'chai';
import { spy } from 'sinon';
import { createShallow, createMount } from '../test-utils';
import StepButton from './StepButton';
import StepLabel from '../StepLabel';
import ButtonBase from '../ButtonBase';

describe('<StepButton />', () => {
  let shallow;
  let mount;
  const defaultProps = { orientation: 'horizontal' };

  before(() => {
    shallow = createShallow({ dive: true });
    mount = createMount();
  });

  after(() => {
    mount.cleanUp();
  });

  it('merges user className into the root node', () => {
    const wrapper = shallow(
      <StepButton className="foo" {...defaultProps}>
        Hello
      </StepButton>,
    );

    assert.include(wrapper.props().className, 'foo');
  });

  it('should render an ButtonBase with a StepLabel', () => {
    const wrapper = shallow(<StepButton {...defaultProps}>Step One</StepButton>);
    assert.ok(wrapper.is(ButtonBase), 'should be an ButtonBase');
    const stepLabel = wrapper.find(StepLabel);
    assert.strictEqual(stepLabel.length, 1);
    assert.strictEqual(stepLabel.props().children, 'Step One');
  });

  it('should pass props to StepLabel', () => {
    const wrapper = shallow(
      <StepButton active completed disabled label="Step One" {...defaultProps}>
        Step One
      </StepButton>,
    );
    const stepLabel = wrapper.find(StepLabel);
    assert.strictEqual(stepLabel.props().active, true);
    assert.strictEqual(stepLabel.props().completed, true);
    assert.strictEqual(stepLabel.props().disabled, true);
  });

  it('should pass props to a provided StepLabel', () => {
    const wrapper = shallow(
      <StepButton active completed disabled label="Step One" {...defaultProps}>
        <StepLabel>Step One</StepLabel>
      </StepButton>,
    );
    const stepLabel = wrapper.find(StepLabel);
    assert.strictEqual(stepLabel.props().active, true);
    assert.strictEqual(stepLabel.props().completed, true);
    assert.strictEqual(stepLabel.props().disabled, true);
  });

  it("should pass disabled prop to a StepLabel's Button", () => {
    const wrapper = shallow(
      <StepButton disabled {...defaultProps}>
        Step One
      </StepButton>,
    );
    const stepLabel = wrapper.find(ButtonBase);
    assert.strictEqual(stepLabel.props().disabled, true);
  });

  describe('event handlers', () => {
    describe('handleMouseEnter/Leave', () => {
      const handleMouseEnter = spy();
      const handleMouseLeave = spy();

      it('should fire event callbacks', () => {
        const wrapper = shallow(
          <StepButton
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...defaultProps}
          >
            Step One
          </StepButton>,
        );
        wrapper.simulate('mouseEnter');
        assert.strictEqual(handleMouseEnter.callCount, 1);
        wrapper.simulate('mouseLeave');
        assert.strictEqual(handleMouseEnter.callCount, 1);
        assert.strictEqual(handleMouseLeave.callCount, 1);
      });
    });

    it('should bubble callbacks used internally', () => {
      const handleMouseEnter = spy();
      const handleMouseLeave = spy();
      const handleTouchStart = spy();
      const wrapper = shallow(
        <StepButton
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          {...defaultProps}
        >
          Step One
        </StepButton>,
      );
      wrapper.simulate('mouseEnter');
      assert.strictEqual(handleMouseEnter.callCount, 1);
      wrapper.simulate('mouseLeave');
      assert.strictEqual(handleMouseEnter.callCount, 1);
      assert.strictEqual(handleMouseLeave.callCount, 1);
      wrapper.simulate('touchStart');
      assert.strictEqual(handleMouseEnter.callCount, 1);
      assert.strictEqual(handleMouseLeave.callCount, 1);
      assert.strictEqual(handleTouchStart.callCount, 1);
      wrapper.simulate('mouseEnter');
      wrapper.simulate('touchStart');
      assert.strictEqual(handleMouseEnter.callCount, 2);
      assert.strictEqual(handleMouseLeave.callCount, 1);
      assert.strictEqual(handleTouchStart.callCount, 2);
    });
  });
});
