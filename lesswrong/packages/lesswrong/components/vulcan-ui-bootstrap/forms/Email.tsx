import React from 'react';
import Form from 'react-bootstrap/Form';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';

const EmailComponent = ({ refFunction, inputProperties, itemProperties }: AnyBecauseTodo) => (
  <Components.FormItem path={inputProperties.path} label={inputProperties.label} {...itemProperties}>
    <Form.Control {...inputProperties} ref={refFunction} type="email" />
  </Components.FormItem>
);

const FormComponentEmailComponent = registerComponent('FormComponentEmail', EmailComponent);

declare global {
  interface ComponentTypes {
    FormComponentEmail: typeof FormComponentEmailComponent
  }
}

