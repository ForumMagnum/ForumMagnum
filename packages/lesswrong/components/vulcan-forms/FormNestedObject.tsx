import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import * as _ from 'underscore';

// Replaceable layout
const FormNestedObjectLayout = ({ hasErrors, label, content }: {
  hasErrors: boolean
  label: React.ReactNode
  content: React.ReactNode
}) => (
  <div
    className={`form-group row form-nested ${hasErrors ? 'input-error' : ''}`}
  >
    <label className="control-label col-sm-3">{label}</label>
    <div className="col-sm-9">{content}</div>
  </div>
);
const FormNestedObjectLayoutComponent = registerComponent('FormNestedObjectLayout', FormNestedObjectLayout);

interface FormNestedObjectProps extends FormComponentWrapperProps<any> {
}

class FormNestedObject extends PureComponent<FormNestedObjectProps> {
  render() {
    //const value = this.getCurrentValue()
    // do not pass FormNested's own value, input and inputProperties props down
    const properties = _.omit(
      this.props,
      'value',
      'input',
      'inputProperties',
      'nestedInput'
    );
    const { errors, getLabel } = this.props;
    // only keep errors specific to the nested array (and not its subfields)
    const nestedObjectErrors = errors.filter(
      error => error.path && error.path === this.props.path
    );
    const hasErrors = !!(nestedObjectErrors && nestedObjectErrors.length);
    return (
      <Components.FormNestedObjectLayout
        hasErrors={hasErrors}
        label={this.props.label}
        content={[
          <Components.FormNestedItem
            key="form-nested-item"
            {...properties}
            path={`${this.props.path}`}
          />,
          hasErrors ? (
            <Components.FieldErrors
              key="form-nested-errors"
              getLabel={getLabel}
              errors={nestedObjectErrors}
            />
          ) : null
        ]}
      />
    );
  }
}

(FormNestedObject as any).propTypes = {
  currentValues: PropTypes.object,
  path: PropTypes.string,
  label: PropTypes.string,
  errors: PropTypes.array.isRequired,
  formComponents: PropTypes.object
};

const FormNestedObjectComponent = registerComponent('FormNestedObject', FormNestedObject);

declare global {
  interface ComponentTypes {
    FormNestedObjectLayout: typeof FormNestedObjectLayoutComponent
    FormNestedObject: typeof FormNestedObjectComponent
  }
}
