import React from 'react';
import { assert } from 'chai';
import { createShallow, getClasses } from '../test-utils';
import FormLabel from './FormLabel';

describe('<FormLabel />', () => {
  let shallow;
  let classes;

  before(() => {
    shallow = createShallow({ dive: true });
    classes = getClasses(<FormLabel />);
  });

  it('should render a <label />', () => {
    const wrapper = shallow(<FormLabel className="woofFormLabel" />);
    assert.strictEqual(wrapper.name(), 'label');
    assert.strictEqual(wrapper.hasClass(classes.root), true);
    assert.strictEqual(wrapper.hasClass('woofFormLabel'), true);
  });

  describe('prop: required', () => {
    it('should show an asterisk if required is set', () => {
      const wrapper = shallow(<FormLabel required />);
      const text = wrapper.text();
      assert.strictEqual(text.slice(-1), '*');
      assert.strictEqual(wrapper.find('[data-mui-test="FormLabelAsterisk"]').length, 1);
    });

    it('should not show an asterisk by default', () => {
      const wrapper = shallow(<FormLabel />);
      assert.strictEqual(wrapper.find('[data-mui-test="FormLabelAsterisk"]').length, 0);
      assert.strictEqual(wrapper.text().includes('*'), false);
    });
  });

  describe('prop: error', () => {
    it('should have an error class', () => {
      const wrapper = shallow(<FormLabel required error />);
      const asteriskWrapper = wrapper.find('[data-mui-test="FormLabelAsterisk"]');
      assert.strictEqual(asteriskWrapper.length, 1);
      assert.strictEqual(asteriskWrapper.hasClass(classes.error), true);
      assert.strictEqual(wrapper.hasClass(classes.error), true);
    });
  });

  describe('with muiFormControl context', () => {
    let wrapper;
    let muiFormControl;

    function setFormControlContext(muiFormControlContext) {
      muiFormControl = muiFormControlContext;
      wrapper.setContext({ muiFormControl });
    }

    beforeEach(() => {
      wrapper = shallow(<FormLabel>Foo</FormLabel>);
    });
    ['error', 'focused'].forEach(visualState => {
      describe(visualState, () => {
        beforeEach(() => {
          setFormControlContext({ [visualState]: true });
        });

        it(`should have the ${visualState} class`, () => {
          assert.strictEqual(wrapper.hasClass(classes[visualState]), true);
        });

        it('should be overridden by props', () => {
          assert.strictEqual(wrapper.hasClass(classes[visualState]), true);
          wrapper.setProps({ [visualState]: false });
          assert.strictEqual(wrapper.hasClass(classes[visualState]), false);
          wrapper.setProps({ [visualState]: true });
          assert.strictEqual(wrapper.hasClass(classes[visualState]), true);
        });
      });
    });

    describe('required', () => {
      beforeEach(() => {
        setFormControlContext({ required: true });
      });

      it('should show an asterisk', () => {
        assert.strictEqual(wrapper.find('[data-mui-test="FormLabelAsterisk"]').length, 1);
      });

      it('should be overridden by props', () => {
        assert.strictEqual(wrapper.find('[data-mui-test="FormLabelAsterisk"]').length, 1);
        wrapper.setProps({ required: false });
        assert.strictEqual(wrapper.find('[data-mui-test="FormLabelAsterisk"]').length, 0);
        wrapper.setProps({ required: true });
        assert.strictEqual(wrapper.find('[data-mui-test="FormLabelAsterisk"]').length, 1);
      });
    });
  });
});
