import React from 'react';
import { assert } from 'chai';
import { createShallow, createMount, getClasses } from '../test-utils';
import Checkbox from '../Checkbox';
import FormControlLabel from './FormControlLabel';

describe('<FormControlLabel />', () => {
  let shallow;
  let mount;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    mount = createMount();
    classes = getClasses(<FormControlLabel label="Pizza" control={<div />} />);
  });

  after(() => {
    mount.cleanUp();
  });

  it('should render the label text inside an additional element', () => {
    const wrapper = shallow(<FormControlLabel label="Pizza" control={<div />} />);
    const label = wrapper.childAt(1);
    assert.strictEqual(wrapper.name(), 'label');
    assert.strictEqual(label.childAt(0).text(), 'Pizza');
    assert.strictEqual(wrapper.hasClass(classes.root), true);
  });

  describe('prop: disabled', () => {
    it('should disable everything 1', () => {
      const wrapper = shallow(<FormControlLabel label="Pizza" disabled control={<div />} />);
      const label = wrapper.childAt(1);
      assert.strictEqual(
        wrapper.hasClass(classes.disabled),
        true,
        'should have the disabled class',
      );
      assert.strictEqual(wrapper.hasClass(classes.disabled), true);
      assert.strictEqual(wrapper.find('div').props().disabled, true);
      assert.strictEqual(label.hasClass(classes.disabled), true);
    });

    it('should disable everything 2', () => {
      const wrapper = shallow(<FormControlLabel label="Pizza" control={<div disabled />} />);
      const label = wrapper.childAt(1);
      assert.strictEqual(
        wrapper.hasClass(classes.disabled),
        true,
        'should have the disabled class',
      );
      assert.strictEqual(wrapper.hasClass(classes.disabled), true);
      assert.strictEqual(wrapper.find('div').props().disabled, true);
      assert.strictEqual(label.hasClass(classes.disabled), true);
    });
  });

  describe('prop: labelPlacement', () => {
    it('should disable have the `start` class', () => {
      const wrapper = shallow(
        <FormControlLabel label="Pizza" labelPlacement="start" control={<div />} />,
      );
      assert.strictEqual(wrapper.hasClass(classes.labelPlacementStart), true);
    });
  });

  it('should mount without issue', () => {
    const wrapper = mount(<FormControlLabel label="Pizza" control={<Checkbox />} />);
    assert.strictEqual(wrapper.type(), FormControlLabel);
  });

  describe('with muiFormControl context', () => {
    let wrapper;
    let muiFormControl;

    function setFormControlContext(muiFormControlContext) {
      muiFormControl = muiFormControlContext;
      wrapper.setContext({ muiFormControl });
    }

    beforeEach(() => {
      wrapper = shallow(<FormControlLabel label="Pizza" control={<div />} />);
    });

    describe('enabled', () => {
      beforeEach(() => {
        setFormControlContext({});
      });

      it('should not have the disabled class', () => {
        assert.strictEqual(wrapper.hasClass(classes.disabled), false);
      });

      it('should be overridden by props', () => {
        assert.strictEqual(wrapper.hasClass(classes.disabled), false);
        wrapper.setProps({ disabled: true });
        assert.strictEqual(wrapper.hasClass(classes.disabled), true);
      });
    });

    describe('disabled', () => {
      beforeEach(() => {
        setFormControlContext({ disabled: true });
      });

      it('should have the disabled class', () => {
        assert.strictEqual(wrapper.hasClass(classes.disabled), true);
      });

      it('should honor props', () => {
        assert.strictEqual(wrapper.hasClass(classes.disabled), true);
        wrapper.setProps({ disabled: false });
        assert.strictEqual(wrapper.hasClass(classes.disabled), false);
      });
    });
  });

  it('should not inject extra properties', () => {
    // eslint-disable-next-line react/prop-types
    const Control = ({ inputRef, ...props }) => <div name="name" {...props} />;
    const wrapper = mount(<FormControlLabel label="Pizza" control={<Control />} />);
    assert.strictEqual(wrapper.find('div').props().name, 'name');
  });

  it('should forward some properties', () => {
    const wrapper = mount(<FormControlLabel value="value" label="Pizza" control={<div />} />);
    assert.strictEqual(wrapper.find('div').props().value, 'value');
  });
});
