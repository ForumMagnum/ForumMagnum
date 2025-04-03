import React from 'react';
import { assert } from 'chai';
import { createShallow, getClasses } from '../test-utils';
import CardActions from './CardActions';

describe('<CardActions />', () => {
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    classes = getClasses(<CardActions />);
  });

  it('should render a div with the root and custom class', () => {
    const wrapper = shallow(<CardActions className="cardActions" />);
    assert.strictEqual(wrapper.name(), 'div');
    assert.strictEqual(wrapper.hasClass(classes.root), true);
    assert.strictEqual(wrapper.hasClass('cardActions'), true);
  });

  it('should pass the action class to children', () => {
    const child3 = false;
    const wrapper = shallow(
      <CardActions>
        <div id="child1" />
        <div id="child2" />
        {child3 && <div id="child3" />}
      </CardActions>,
    );

    assert.strictEqual(wrapper.find('#child1').hasClass(classes.action), true);
    assert.strictEqual(wrapper.find('#child2').hasClass(classes.action), true);
  });

  it('should not pass the action class to children', () => {
    const wrapper = shallow(
      <CardActions disableActionSpacing>
        <div id="child1" />
        <div id="child2" />
      </CardActions>,
    );

    assert.strictEqual(wrapper.find('#child1').hasClass(classes.action), false);
    assert.strictEqual(wrapper.find('#child2').hasClass(classes.action), false);
  });
});
