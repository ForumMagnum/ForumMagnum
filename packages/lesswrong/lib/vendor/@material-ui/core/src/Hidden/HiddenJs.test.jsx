import React from 'react';
import { assert } from 'chai';
import { createShallow } from '../test-utils';
import HiddenJs from './HiddenJs';

describe('<HiddenJs />', () => {
  let shallow;

  before(() => {
    shallow = createShallow({ dive: true });
  });

  function resolvePropName(upDownOnly, breakpoint) {
    if (upDownOnly === 'only') {
      return 'only';
    }

    return `${breakpoint}${upDownOnly}`;
  }

  function isHidden(hiddenBreakpoints, upDownOnly, width) {
    hiddenBreakpoints.forEach(breakpoint => {
      const prop = resolvePropName(upDownOnly, breakpoint);
      const descriptions = {
        Up: `${prop} is hidden for width: ${width} >= ${breakpoint}`,
        Down: `${prop} is hidden for width: ${width} < ${breakpoint}`,
        only: `${prop} is hidden for width: ${width} === ${breakpoint}`,
      };
      const props = { [prop]: upDownOnly === 'only' ? breakpoint : true };

      it(descriptions[upDownOnly], () => {
        let wrapper = shallow(
          <HiddenJs width={width} {...props}>
            <div>foo</div>
          </HiddenJs>,
        );
        wrapper = wrapper.find('HiddenJs').shallow();
        assert.strictEqual(wrapper.type(), null, 'should render null');
      });
    });
  }

  function isVisible(visibleBreakpoints, upDownOnly, width) {
    visibleBreakpoints.forEach(breakpoint => {
      const prop = resolvePropName(upDownOnly, breakpoint);
      const descriptions = {
        Up: `${prop} is visible for width: ${width} < ${breakpoint}`,
        Down: `${prop} is visible for width: ${width} >= ${breakpoint}`,
        only: `${prop} is visible for width: ${width} !== ${breakpoint}`,
      };
      const props = { [prop]: upDownOnly === 'only' ? breakpoint : true };

      it(descriptions[upDownOnly], () => {
        let wrapper = shallow(
          <HiddenJs width={width} {...props}>
            <div>foo</div>
          </HiddenJs>,
        );
        wrapper = wrapper.find('HiddenJs').shallow();
        assert.isNotNull(wrapper.type(), 'should render');
        assert.strictEqual(wrapper.name(), 'div');
        assert.strictEqual(wrapper.first().text(), 'foo', 'should render children');
      });
    });
  }

  describe('screen width: xs', () => {
    describe('up', () => {
      isHidden(['xs'], 'Up', 'xs');
      isVisible(['sm', 'md', 'lg', 'xl'], 'Up', 'xs');
    });

    describe('down', () => {
      isHidden(['xs', 'sm', 'md', 'lg', 'xl'], 'Down', 'xs');
    });

    describe('only', () => {
      isHidden(['xs', ['xs', 'xl']], 'only', 'xs');
      isVisible(['sm', 'md', 'lg', 'xl', ['sm', 'md', 'lg', 'xl']], 'only', 'xs');
    });
  });

  describe('screen width: sm', () => {
    describe('up', () => {
      isHidden(['xs', 'sm'], 'Up', 'sm');
      isVisible(['md', 'lg', 'xl'], 'Up', 'sm');
    });

    describe('down', () => {
      isHidden(['sm', 'md', 'lg', 'xl'], 'Down', 'sm');
      isVisible(['xs'], 'Down', 'sm');
    });

    describe('only', () => {
      isHidden(['sm', ['sm', 'md']], 'only', 'sm');
      isVisible(['xs', 'md', 'lg', 'xl', ['xs', 'md', 'lg', 'xl']], 'only', 'sm');
    });
  });

  describe('screen width: md', () => {
    describe('up', () => {
      isHidden(['xs', 'sm', 'md'], 'Up', 'md');
      isVisible(['lg', 'xl'], 'Up', 'md');
    });

    describe('down', () => {
      isHidden(['md', 'lg', 'xl'], 'Down', 'md');
      isVisible(['xs', 'sm'], 'Down', 'md');
    });

    describe('only', () => {
      isHidden(['md', ['md', 'lg']], 'only', 'md');
      isVisible(['xs', 'sm', 'lg', 'xl', ['xs', 'sm', 'lg', 'xl']], 'only', 'md');
    });
  });

  describe('screen width: lg', () => {
    describe('up', () => {
      isHidden(['xs', 'sm', 'md', 'lg'], 'Up', 'lg');
      isVisible(['xl'], 'Up', 'lg');
    });

    describe('down', () => {
      isHidden(['lg', 'xl'], 'Down', 'lg');
      isVisible(['xs', 'sm', 'md'], 'Down', 'lg');
    });

    describe('only', () => {
      isHidden(['lg', ['lg', 'xl']], 'only', 'lg');
      isVisible(['xs', 'sm', 'md', 'xl', ['xs', 'sm', 'md', 'xl']], 'only', 'lg');
    });
  });

  describe('screen width: xl', () => {
    describe('up', () => {
      isHidden(['xs', 'sm', 'md', 'lg', 'xl'], 'Up', 'xl');
    });

    describe('down', () => {
      isHidden(['xl'], 'Down', 'xl');
      isVisible(['xs', 'sm', 'md', 'lg'], 'Down', 'xl');
    });

    describe('only', () => {
      isHidden(['xl', ['xl', 'xs']], 'only', 'xl');
      isVisible(['xs', 'sm', 'md', 'lg', ['xs', 'sm', 'md', 'lg']], 'only', 'xl');
    });
  });
});
