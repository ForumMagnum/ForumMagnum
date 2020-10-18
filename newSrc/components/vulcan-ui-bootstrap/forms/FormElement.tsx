// import React from 'react';
import Form from 'react-bootstrap/Form';
import { registerComponent } from '../../../lib/vulcan-lib';

const FormElementComponent = registerComponent('FormElement', Form);

declare global {
  interface ComponentTypes {
    FormElement: typeof FormElementComponent
  }
}

