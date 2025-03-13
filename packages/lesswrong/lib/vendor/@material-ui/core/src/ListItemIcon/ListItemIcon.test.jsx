import React from 'react';
import { assert } from 'chai';
import { createShallow, getClasses } from '../test-utils';
import ListItemIcon from './ListItemIcon';

describe('<ListItemIcon />', () => {
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    classes = getClasses(
      <ListItemIcon>
        <span />
      </ListItemIcon>,
    );
  });

  it('should render a span', () => {
    const wrapper = shallow(
      <ListItemIcon>
        <span />
      </ListItemIcon>,
    );
    assert.strictEqual(wrapper.name(), 'span');
  });

  it('should render with the user and root classes', () => {
    const wrapper = shallow(
      <ListItemIcon className="foo">
        <span className="bar" />
      </ListItemIcon>,
    );
    assert.strictEqual(wrapper.hasClass('foo'), true);
    assert.strictEqual(wrapper.hasClass('bar'), true);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });
});
