import React from 'react';
import { assert } from 'chai';
import CheckCircle from '../internal/svg-icons/CheckCircle';
import Warning from '../internal/svg-icons/Warning';
import { createShallow, createMount } from '../test-utils';
import StepIcon from './StepIcon';
import SvgIcon from '../SvgIcon';

describe('<StepIcon />', () => {
  let shallow;
  let mount;

  before(() => {
    shallow = createShallow({ dive: true });
    mount = createMount();
  });

  after(() => {
    mount.cleanUp();
  });

  it('renders <CheckCircle> when completed', () => {
    const wrapper = mount(<StepIcon icon={1} completed />);
    const checkCircle = wrapper.find(CheckCircle);
    assert.strictEqual(checkCircle.length, 1, 'should have an <CheckCircle />');
  });

  it('renders <Warning> when error occured', () => {
    const wrapper = mount(<StepIcon icon={1} error />);
    const warning = wrapper.find(Warning);
    assert.strictEqual(warning.length, 1, 'should have an <Warning />');
  });

  it('renders a <SvgIcon>', () => {
    const wrapper = shallow(<StepIcon icon={1} />);
    assert.strictEqual(wrapper.find(SvgIcon).length, 1);
  });

  it('contains text "3" when position is "3"', () => {
    const wrapper = shallow(<StepIcon icon={3} />);
    assert.strictEqual(wrapper.find('text').text(), '3');
  });

  it('renders the custom icon', () => {
    const wrapper = shallow(<StepIcon icon={<span className="my-icon" />} />);
    assert.strictEqual(wrapper.find('.my-icon').length, 1, 'should have the custom icon');
  });
});
