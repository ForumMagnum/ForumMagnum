import React from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const FormNestedFoot = ({ addItem, label, className }) => (
  <Components.Button size="small" variant="success" onClick={addItem} className="form-nested-button">
    <Components.IconAdd height={12} width={12} />
  </Components.Button>
);

FormNestedFoot.propTypes = {
  label: PropTypes.string,
  addItem: PropTypes.func,
};

const FormNestedFootComponent = registerComponent('FormNestedFoot', FormNestedFoot);

declare global {
  interface ComponentTypes {
    FormNestedFoot: typeof FormNestedFootComponent
  }
}
