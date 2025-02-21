import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';

const FormNestedHead = ({ label, addItem }: {
  label: string
  addItem: () => void
}) => (
  <label className="control-label col-sm-3">{label}</label>
);

const FormNestedHeadComponent = registerComponent('FormNestedHead', FormNestedHead);

declare global {
  interface ComponentTypes {
    FormNestedHead: typeof FormNestedHeadComponent
  }
}
