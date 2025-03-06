import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import Button from "@/components/vulcan-ui-bootstrap/ui/Button";
import { IconAdd } from "@/components/vulcan-forms/FormNestedArray";

const FormNestedFoot = ({ addItem, label }: {
  addItem: () => void
  label?: string
}) => (
  <Button size="small" variant="success" onClick={addItem} className="form-nested-button">
    <IconAdd height={12} width={12} />
  </Button>
);

const FormNestedFootComponent = registerComponent('FormNestedFoot', FormNestedFoot);

declare global {
  interface ComponentTypes {
    FormNestedFoot: typeof FormNestedFootComponent
  }
}

export default FormNestedFootComponent;
