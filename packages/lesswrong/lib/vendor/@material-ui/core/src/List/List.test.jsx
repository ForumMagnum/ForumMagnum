import React from 'react';
import { assert } from 'chai';
import { createShallow, getClasses } from '../test-utils';
import ListSubheader from '../ListSubheader';
import List from './List';

describe('<List />', () => {
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    classes = getClasses(<List />);
  });

  it('should render a div', () => {
    const wrapper = shallow(<List component="div" />);
    assert.strictEqual(wrapper.name(), 'div');
  });

  it('should render a ul', () => {
    const wrapper = shallow(<List />);
    assert.strictEqual(wrapper.name(), 'ul');
  });

  it('should render with the user, root and padding classes', () => {
    const wrapper = shallow(<List className="woofList" />);
    assert.strictEqual(wrapper.hasClass('woofList'), true);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
    assert.strictEqual(wrapper.hasClass(classes.padding), true);
  });

  it('should disable the padding', () => {
    const wrapper = shallow(<List disablePadding />);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
    assert.strictEqual(
      wrapper.hasClass(classes.padding),
      false,
      'should not have the padding class',
    );
  });

  describe('prop: subheader', () => {
    it('should render with subheader class', () => {
      const wrapper = shallow(<List subheader={<ListSubheader>Title</ListSubheader>} />);
      assert.strictEqual(wrapper.hasClass(classes.root), true);
      assert.strictEqual(
        wrapper.hasClass(classes.subheader),
        true,
        'should have the subheader class',
      );
    });

    it('should render ListSubheader', () => {
      const wrapper = shallow(<List subheader={<ListSubheader>Title</ListSubheader>} />);
      assert.strictEqual(wrapper.find(ListSubheader).length, 1);
    });
  });

  describe('context: dense', () => {
    it('should forward the context', () => {
      const wrapper1 = shallow(<List />);
      assert.strictEqual(
        wrapper1.instance().getChildContext().dense,
        false,
        'dense should be false by default',
      );

      const wrapper2 = shallow(<List dense />);
      assert.strictEqual(wrapper2.instance().getChildContext().dense, true);
    });
  });
});
