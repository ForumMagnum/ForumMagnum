import React from 'react';
import { assert } from 'chai';
import { createShallow, getClasses } from '../test-utils';
import DialogContentText from './DialogContentText';

describe('<DialogContentText />', () => {
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    classes = getClasses(<DialogContentText />);
  });

  describe('prop: className', () => {
    it('should render with the user and root classes', () => {
      const wrapper = shallow(<DialogContentText className="woofDialogContentText" />);
      assert.strictEqual(wrapper.props().className, 'woofDialogContentText');
      assert.strictEqual(wrapper.props().classes.root, classes.root);
    });
  });

  describe('prop: children', () => {
    it('should render children', () => {
      const children = <p />;
      const wrapper = shallow(<DialogContentText>{children}</DialogContentText>);
      assert.strictEqual(wrapper.children().equals(children), true);
    });
  });
});
