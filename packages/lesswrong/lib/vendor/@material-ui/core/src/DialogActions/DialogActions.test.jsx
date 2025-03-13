import React from 'react';
import { assert } from 'chai';
import { createShallow, getClasses } from '../test-utils';
import DialogActions from './DialogActions';

describe('<DialogActions />', () => {
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    classes = getClasses(<DialogActions />);
  });

  it('should render a div', () => {
    const wrapper = shallow(<DialogActions />);
    assert.strictEqual(wrapper.name(), 'div');
  });

  it('should spread custom props on the root node', () => {
    const wrapper = shallow(<DialogActions data-my-prop="woofDialogActions" />);
    assert.strictEqual(wrapper.props()['data-my-prop'], 'woofDialogActions');
  });

  it('should render with the user and root classes', () => {
    const wrapper = shallow(<DialogActions className="woofDialogActions" />);
    assert.strictEqual(wrapper.hasClass('woofDialogActions'), true);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });

  it('should render children with the button class wrapped in a div with the action class', () => {
    const wrapper = shallow(
      <DialogActions>
        <button type="submit" className="woofDialogActions">
          Hello
        </button>
      </DialogActions>,
    );
    const button = wrapper.childAt(0);
    assert.strictEqual(button.name(), 'button');
    assert.strictEqual(button.hasClass('woofDialogActions'), true);
    assert.strictEqual(button.hasClass(classes.action), true);
  });

  it('should render children with the conditional buttons', () => {
    const showButton = true;
    const wrapper = shallow(
      <DialogActions>
        {showButton ? (
          <button type="submit" className="woofDialogActions">
            Hello
          </button>
        ) : null}
        {!showButton ? <button type="submit">false button</button> : null}
      </DialogActions>,
    );

    const button = wrapper.childAt(0);
    assert.strictEqual(button.hasClass('woofDialogActions'), true);
    assert.strictEqual(button.hasClass(classes.action), true);
    assert.strictEqual(button.name(), 'button');
  });
});
