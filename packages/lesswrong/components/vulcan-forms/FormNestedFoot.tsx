import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const FormNestedFoot = ({ addItem, label }: {
  addItem: () => void
  label?: string
}) => (
  <button onClick={addItem} className="form-nested-button">
    <Components.IconAdd height={12} width={12} />
  </button>
);

const FormNestedFootComponent = registerComponent('FormNestedFoot', FormNestedFoot);

declare global {
  interface ComponentTypes {
    FormNestedFoot: typeof FormNestedFootComponent
  }
}
