import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const FormNestedDivider = ({ label, addItem }: {
  label?: string
  addItem: () => void
}) => <div/>;

const FormNestedDividerComponent = registerComponent('FormNestedDivider', FormNestedDivider);

declare global {
  interface ComponentTypes {
    FormNestedDivider: typeof FormNestedDividerComponent
  }
}
