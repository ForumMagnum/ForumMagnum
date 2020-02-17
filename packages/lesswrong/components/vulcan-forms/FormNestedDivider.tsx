import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';

const FormNestedDivider = ({ label, addItem }) => <div/>;

FormNestedDivider.propTypes = {
  label: PropTypes.string,
  addItem: PropTypes.func,
};

const FormNestedDividerComponent = registerComponent('FormNestedDivider', FormNestedDivider);

declare global {
  interface ComponentTypes {
    FormNestedDivider: typeof FormNestedDividerComponent
  }
}
