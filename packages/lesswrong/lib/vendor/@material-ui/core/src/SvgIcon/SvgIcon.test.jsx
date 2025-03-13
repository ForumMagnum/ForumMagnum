import React from 'react';
import { assert } from 'chai';
import { createShallow, createMount, getClasses } from '../test-utils';
import SvgIcon from './SvgIcon';

describe('<SvgIcon />', () => {
  let shallow;
  let mount;
  let classes;
  let path;

  before(() => {
    shallow = createShallow({ dive: true });
    mount = createMount();
    classes = getClasses(<SvgIcon>foo</SvgIcon>);
    path = <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />;
  });

  after(() => {
    mount.cleanUp();
  });

  it('renders children by default', () => {
    const wrapper = shallow(<SvgIcon>{path}</SvgIcon>);
    assert.strictEqual(wrapper.contains(path), true);
    assert.strictEqual(wrapper.props()['aria-hidden'], 'true');
  });

  it('should render an svg', () => {
    const wrapper = shallow(<SvgIcon>book</SvgIcon>);
    assert.strictEqual(wrapper.name(), 'svg');
  });

  it('should spread props on svg', () => {
    const wrapper = shallow(
      <SvgIcon data-test="hello" viewBox="0 0 32 32">
        {path}
      </SvgIcon>,
    );
    assert.strictEqual(wrapper.props()['data-test'], 'hello');
    assert.strictEqual(wrapper.props().viewBox, '0 0 32 32');
  });

  describe('prop: titleAccess', () => {
    it('should be able to make an icon accessible', () => {
      const wrapper = shallow(
        <SvgIcon title="Go to link" titleAccess="Network">
          {path}
        </SvgIcon>,
      );
      assert.strictEqual(wrapper.find('title').text(), 'Network');
      assert.strictEqual(wrapper.props()['aria-hidden'], 'false');
    });
  });

  describe('prop: color', () => {
    it('should render with the user and SvgIcon classes', () => {
      const wrapper = shallow(<SvgIcon className="meow">{path}</SvgIcon>);
      assert.strictEqual(wrapper.hasClass('meow'), true);
      assert.strictEqual(wrapper.hasClass(classes.root), true);
    });

    it('should render with the secondary color', () => {
      const wrapper = shallow(<SvgIcon color="secondary">{path}</SvgIcon>);
      assert.strictEqual(wrapper.hasClass(classes.colorSecondary), true);
    });

    it('should render with the action color', () => {
      const wrapper = shallow(<SvgIcon color="action">{path}</SvgIcon>);
      assert.strictEqual(wrapper.hasClass(classes.colorAction), true);
    });

    it('should render with the error color', () => {
      const wrapper = shallow(<SvgIcon color="error">{path}</SvgIcon>);
      assert.strictEqual(wrapper.hasClass(classes.colorError), true);
    });

    it('should render with the primary class', () => {
      const wrapper = shallow(<SvgIcon color="primary">{path}</SvgIcon>);
      assert.strictEqual(wrapper.hasClass(classes.colorPrimary), true);
    });
  });

  describe('prop: fontSize', () => {
    it('should be able to change the fontSize', () => {
      const wrapper = shallow(<SvgIcon fontSize="inherit">{path}</SvgIcon>);
      assert.strictEqual(wrapper.hasClass(classes.fontSizeInherit), true);
    });
  });

  describe('prop: component', () => {
    it('should render component before path', () => {
      const wrapper = mount(
        <SvgIcon
          component={props => (
            <svg {...props}>
              <defs>
                <linearGradient id="gradient1">
                  <stop offset="20%" stopColor="#39F" />
                  <stop offset="90%" stopColor="#F3F" />
                </linearGradient>
              </defs>
              {props.children}
            </svg>
          )}
        >
          {path}
        </SvgIcon>,
      );
      assert.strictEqual(wrapper.find('defs').length, 1);
    });
  });
});
