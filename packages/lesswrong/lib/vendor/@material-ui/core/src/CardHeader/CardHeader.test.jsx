import React from 'react';
import { assert } from 'chai';
import { createShallow, getClasses } from '../test-utils';
import CardHeader from './CardHeader';
import Typography from '../Typography';

describe('<CardHeader />', () => {
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ untilSelector: 'div' });
    classes = getClasses(<CardHeader />);
  });

  it('should render CardContent', () => {
    const wrapper = shallow(<CardHeader />);
    assert.strictEqual(wrapper.name(), 'div');
  });

  it('should have the root class', () => {
    const wrapper = shallow(<CardHeader />);
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });

  describe('with custom styles', () => {
    let wrapper;
    let extraClasses;

    beforeEach(() => {
      extraClasses = { title: 'foo', subheader: 'bar' };
      wrapper = shallow(
        <CardHeader
          title="Title"
          subheader="Subheader"
          classes={{ title: extraClasses.title, subheader: extraClasses.subheader }}
        />,
      ).childAt(0);
    });

    it('should render with the title class', () => {
      const title = wrapper.childAt(0);
      assert.strictEqual(title.hasClass(extraClasses.title), true);
    });

    it('should render with the subheader class', () => {
      const subheader = wrapper.childAt(1);
      assert.strictEqual(subheader.hasClass(extraClasses.subheader), true);
    });
  });

  describe('without an avatar', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = shallow(<CardHeader title="Title" subheader="Subheader" />).childAt(0);
    });

    it('should render the title as headline text', () => {
      const title = wrapper.childAt(0);
      assert.strictEqual(title.type(), Typography);
      assert.strictEqual(title.props().variant, 'headline');
    });

    it('should render the subheader as body1 secondary text', () => {
      const subheader = wrapper.childAt(1);
      assert.strictEqual(subheader.type(), Typography);
      assert.strictEqual(subheader.props().variant, 'body1');
      assert.strictEqual(subheader.props().color, 'textSecondary');
    });

    it('should not render the subheader if none is given', () => {
      const title = wrapper.childAt(0);
      assert.strictEqual(title.type(), Typography);
      assert.strictEqual(wrapper.length, 1);
    });
  });

  describe('with an avatar', () => {
    let wrapper;
    let avatar;

    beforeEach(() => {
      avatar = <span />;
      wrapper = shallow(<CardHeader avatar={avatar} title="Title" subheader="Subhead" />);
    });

    it('should render the avatar inside the first child', () => {
      const container = wrapper.childAt(0);

      assert.strictEqual(container.name(), 'div');
      assert.strictEqual(container.hasClass(classes.avatar), true);
      assert.strictEqual(container.childAt(0).equals(avatar), true);
    });

    it('should render the title as body2 text inside the second child', () => {
      const container = wrapper.childAt(1);
      assert.strictEqual(
        container.hasClass(classes.content),
        true,
        'should have the content class',
      );
      const title = container.childAt(0);
      assert.strictEqual(title.type(), Typography);
      assert.strictEqual(title.props().variant, 'body2');
    });

    it('should render the subeader as body2 secondary text inside the second child', () => {
      const container = wrapper.childAt(1);
      assert.strictEqual(
        container.hasClass(classes.content),
        true,
        'should have the content class',
      );
      const subheader = container.childAt(1);
      assert.strictEqual(subheader.type(), Typography);
      assert.strictEqual(subheader.props().variant, 'body2');
      assert.strictEqual(subheader.props().color, 'textSecondary');
    });
  });
});
