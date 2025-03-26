import React from 'react';
import { assert } from 'chai';
import { createShallow, getClasses } from '../test-utils';
import ListItemText from '../ListItemText';
import ListItemSecondaryAction from '../ListItemSecondaryAction';
import ListItem from './ListItem';
import ListItemAvatar from '../ListItemAvatar';
import Avatar from '../Avatar';
import ButtonBase from '../ButtonBase';

describe('<ListItem />', () => {
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    classes = getClasses(<ListItem />);
  });

  it('should render a div', () => {
    const wrapper = shallow(<ListItem component="div" />);
    assert.strictEqual(wrapper.name(), 'div');
  });

  it('should render a li', () => {
    const wrapper = shallow(<ListItem />);
    assert.strictEqual(wrapper.name(), 'li');
  });

  it('should render with the user, root and gutters classes', () => {
    const wrapper = shallow(<ListItem className="woofListItem" />);
    assert.strictEqual(wrapper.hasClass('woofListItem'), true);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
    assert.strictEqual(wrapper.hasClass(classes.gutters), true);
  });

  it('should render with the selected class', () => {
    const wrapper = shallow(<ListItem selected />);
    assert.strictEqual(wrapper.hasClass(classes.selected), true);
  });

  it('should disable the gutters', () => {
    const wrapper = shallow(<ListItem disableGutters />);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
    assert.strictEqual(
      wrapper.hasClass(classes.gutters),
      false,
      'should not have the gutters class',
    );
  });

  it('should use dense class when ListItemAvatar is present', () => {
    const wrapper = shallow(
      <ListItem>
        <ListItemAvatar>
          <Avatar />
        </ListItemAvatar>
      </ListItem>,
      {
        context: {
          dense: false,
        },
      },
    );

    assert.strictEqual(wrapper.hasClass(classes.dense), true);
  });

  describe('prop: button', () => {
    it('should render a div', () => {
      const wrapper = shallow(<ListItem button />);
      assert.strictEqual(wrapper.props().component, 'div');
    });
  });

  describe('prop: component', () => {
    it('should change the component', () => {
      const wrapper = shallow(<ListItem button component="a" />);
      assert.strictEqual(wrapper.props().component, 'a');
    });

    it('should change the component', () => {
      const wrapper = shallow(<ListItem button component="li" />);
      assert.strictEqual(wrapper.props().component, 'li');
    });
  });

  describe('context: dense', () => {
    it('should forward the context', () => {
      const wrapper = shallow(<ListItem />);
      assert.strictEqual(
        wrapper.instance().getChildContext().dense,
        false,
        'dense should be false by default',
      );

      wrapper.setProps({ dense: true });
      assert.strictEqual(
        wrapper.instance().getChildContext().dense,
        true,
        'dense should be true when set',
      );
    });
  });

  describe('secondary action', () => {
    it('should wrap with a container', () => {
      const wrapper = shallow(
        <ListItem>
          <ListItemText primary="primary" />
          <ListItemSecondaryAction />
        </ListItem>,
      );
      assert.strictEqual(wrapper.hasClass(classes.container), true);
      assert.strictEqual(wrapper.type(), 'li');
      assert.strictEqual(wrapper.childAt(0).type(), 'div');
    });

    it('should accept a component property', () => {
      const wrapper = shallow(
        <ListItem component="span">
          <ListItemText primary="primary" />
          <ListItemSecondaryAction />
        </ListItem>,
      );
      assert.strictEqual(wrapper.hasClass(classes.container), true);
      assert.strictEqual(wrapper.type(), 'li');
      assert.strictEqual(wrapper.childAt(0).type(), 'span');
    });

    it('should accet a button property', () => {
      const wrapper = shallow(
        <ListItem button>
          <ListItemText primary="primary" />
          <ListItemSecondaryAction />
        </ListItem>,
      );
      assert.strictEqual(wrapper.hasClass(classes.container), true);
      assert.strictEqual(wrapper.type(), 'li');
      assert.strictEqual(wrapper.childAt(0).type(), ButtonBase);
    });

    it('should accept a ContainerComponent property', () => {
      const wrapper = shallow(
        <ListItem ContainerComponent="div">
          <ListItemText primary="primary" />
          <ListItemSecondaryAction />
        </ListItem>,
      );
      assert.strictEqual(wrapper.hasClass(classes.container), true);
      assert.strictEqual(wrapper.type(), 'div');
      assert.strictEqual(wrapper.childAt(0).type(), 'div');
    });

    it('should allow customization of the wrapper', () => {
      const wrapper = shallow(
        <ListItem ContainerProps={{ className: 'bubu' }}>
          <ListItemText primary="primary" />
          <ListItemSecondaryAction />
        </ListItem>,
      );
      assert.strictEqual(wrapper.hasClass(classes.container), true);
      assert.strictEqual(wrapper.hasClass('bubu'), true);
    });
  });

  describe('prop: focusVisibleClassName', () => {
    it('should merge the class names', () => {
      const wrapper = shallow(<ListItem button focusVisibleClassName="focusVisibleClassName" />);
      assert.strictEqual(wrapper.props().component, 'div');
      assert.strictEqual(
        wrapper.props().focusVisibleClassName,
        `${classes.focusVisible} focusVisibleClassName`,
      );
    });
  });
});
