import React from 'react';
import { assert } from 'chai';
import { createShallow, getClasses } from '../test-utils';
import Grid from './Grid';

describe('<Grid />', () => {
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    classes = getClasses(<Grid />);
  });

  it('should render', () => {
    const wrapper = shallow(<Grid className="woofGrid" />);
    assert.strictEqual(wrapper.name(), 'div');
    assert.strictEqual(wrapper.hasClass('woofGrid'), true);
  });

  describe('prop: container', () => {
    it('should apply the container class', () => {
      const wrapper = shallow(<Grid container />);
      assert.strictEqual(wrapper.hasClass(classes.container), true);
    });
  });

  describe('prop: item', () => {
    it('should apply the item class', () => {
      const wrapper = shallow(<Grid item />);
      assert.strictEqual(wrapper.hasClass(classes.item), true);
    });
  });

  describe('prop: component', () => {
    it('should change the component', () => {
      const wrapper = shallow(<Grid component="span" />);
      assert.strictEqual(wrapper.name(), 'span');
    });
  });

  describe('prop: xs', () => {
    it('should apply the flex-grow class', () => {
      const wrapper = shallow(<Grid item xs />);
      assert.strictEqual(wrapper.hasClass(classes['grid-xs-true']), true);
    });

    it('should apply the flex size class', () => {
      const wrapper = shallow(<Grid item xs={3} />);
      assert.strictEqual(wrapper.hasClass(classes['grid-xs-3']), true);
    });

    it('should apply the flex auto class', () => {
      const wrapper = shallow(<Grid item xs="auto" />);
      assert.strictEqual(wrapper.hasClass(classes['grid-xs-auto']), true);
    });
  });

  describe('prop: spacing', () => {
    it('should have a spacing', () => {
      const wrapper = shallow(<Grid container spacing={8} />);
      assert.strictEqual(wrapper.hasClass(classes['spacing-xs-8']), true);
    });
  });

  describe('prop: alignItems', () => {
    it('should apply the align-item class', () => {
      const wrapper = shallow(<Grid alignItems="center" container />);
      assert.strictEqual(wrapper.hasClass(classes['align-items-xs-center']), true);
    });
  });

  describe('prop: alignContent', () => {
    it('should apply the align-content class', () => {
      const wrapper = shallow(<Grid alignContent="center" container />);
      assert.strictEqual(wrapper.hasClass(classes['align-content-xs-center']), true);
    });
  });

  describe('prop: justify', () => {
    it('should apply the justify class', () => {
      const wrapper = shallow(<Grid justify="space-evenly" container />);
      assert.strictEqual(wrapper.hasClass(classes['justify-xs-space-evenly']), true);
    });
  });

  describe('prop: other', () => {
    it('should spread the other properties to the root element', () => {
      const handleClick = () => {};
      const wrapper = shallow(<Grid component="span" onClick={handleClick} />);
      assert.strictEqual(wrapper.props().onClick, handleClick);
    });
  });
});
