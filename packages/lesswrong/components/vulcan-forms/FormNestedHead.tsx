import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';

const FormNestedHead = ({ label, addItem }) => (
  <label className="control-label col-sm-3">{label}</label>
);

FormNestedHead.propTypes = {
  label: PropTypes.string,
  addItem: PropTypes.func,
};

const FormNestedHeadComponent = registerComponent('FormNestedHead', FormNestedHead);

declare global {
  interface ComponentTypes {
    FormNestedHead: typeof FormNestedHeadComponent
  }
}
