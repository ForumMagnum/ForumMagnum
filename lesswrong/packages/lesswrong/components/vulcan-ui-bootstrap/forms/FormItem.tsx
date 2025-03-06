/*

Layout for a single form item

*/

import React from 'react';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { registerComponent } from '../../../lib/vulcan-lib/components';

const FormItem = ({ path, label, children, beforeInput, afterInput, layout = 'horizontal', ...rest }: AnyBecauseTodo) => {
  if (layout === 'inputOnly' || !label) { // input only layout
    return (
      <Form.Group controlId={path} {...rest}>
        {beforeInput}
        {children}
        {afterInput}
      </Form.Group>
    );
  } else if (layout === 'vertical') { // vertical layout
    return <div>TODO</div>;
  } else { // horizontal layout (default)
    return (
      <Form.Group as={Row} controlId={path} {...rest}>
        <Form.Label column sm={3}>
          {label}
        </Form.Label>
        <Col sm={9}>
          {beforeInput}
          {children}
          {afterInput}
        </Col>
      </Form.Group>
    );
  }
};

const FormItemComponent = registerComponent('FormItem', FormItem);

declare global {
  interface ComponentTypes {
    FormItem: typeof FormItemComponent
  }
}

export default FormItemComponent;

