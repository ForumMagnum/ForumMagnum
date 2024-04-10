import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const FormNestedFoot = ({ addItem, label }: {
  addItem: () => void
  label?: string
}) => (
  <Components.Button size="small" variant="success" onClick={addItem} className="form-nested-button">
    <Components.IconAdd height={12} width={12} />
  </Components.Button>
);

const FormNestedFootComponent = registerComponent('FormNestedFoot', FormNestedFoot);

declare global {
  interface ComponentTypes {
    FormNestedFoot: typeof FormNestedFootComponent
  }
}
