import React from 'react';
import Form from 'react-bootstrap/Form';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';

const TextareaComponent = ({ refFunction, inputProperties, itemProperties }: AnyBecauseTodo) => (
  <Components.FormItem path={inputProperties.path} label={inputProperties.label} {...itemProperties}>
    <Form.Control as="textarea" ref={refFunction} {...inputProperties} />
  </Components.FormItem>
);

const FormComponentTextareaComponent = registerComponent('FormComponentTextarea', TextareaComponent);

declare global {
  interface ComponentTypes {
    FormComponentTextarea: typeof FormComponentTextareaComponent
  }
}

