import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import * as _ from 'underscore';

// Replaceable layout
const FormNestedArrayLayout = ({ hasErrors, label, content }: {
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
const FormNestedArrayLayoutComponent = registerComponent('FormNestedArrayLayout', FormNestedArrayLayout);

interface FormNestedArrayProps<T> extends FormComponentWrapperProps<T> {
  value: T
  minCount?: number
  maxCount?: number
}

class FormNestedArray extends PureComponent<FormNestedArrayProps<any>> {
  getCurrentValue() {
    return this.props.value || [];
  }

  addItem = () => {
    const value = this.getCurrentValue();
    void this.props.updateCurrentValues(
      { [`${this.props.path}.${value.length}`]: {} },
      { mode: 'merge' }
    );
  };

  removeItem = (index: number) => {
    void this.props.updateCurrentValues({ [`${this.props.path}.${index}`]: null });
  };

  /*

  Go through this.context.deletedValues and see if any value matches both the current field
  and the given index (ex: if we want to know if the second address is deleted, we
  look for the presence of 'addresses.1')
  */
  isDeleted = (index: number) => {
    return this.props.deletedValues.includes(`${this.props.path}.${index}`);
  };

  render() {
    const value = this.getCurrentValue();
    // do not pass FormNested's own value, input and inputProperties props down
    const properties = _.omit(
      this.props,
      'value',
      'input',
      'inputProperties',
      'nestedInput'
    );
    const { errors, path, label, minCount, maxCount } = this.props;

    //filter out null values to calculate array length
    let arrayLength = value.filter((singleValue: AnyBecauseTodo) => {
      return !!singleValue;
    }).length;

    // only keep errors specific to the nested array (and not its subfields)
    const nestedArrayErrors = errors.filter(
      error => error.path && error.path === path
    );
    const hasErrors = !!(nestedArrayErrors && nestedArrayErrors.length);
    
    return (
      <Components.FormNestedArrayLayout
        label={label}
        hasErrors={hasErrors}
        content={[
          value.map(
            (subDocument: AnyBecauseTodo, i: number) =>
              !this.isDeleted(i) && (
                <React.Fragment key={i}>
                  <Components.FormNestedItem
                    {...properties}
                    itemIndex={i}
                    path={`${this.props.path}.${i}`}
                    removeItem={() => {
                      this.removeItem(i);
                    }}
                    hideRemove={!!minCount && arrayLength <= minCount}
                  />
                  <Components.FormNestedDivider
                    label={this.props.label}
                    addItem={this.addItem}
                  />
                </React.Fragment>
              )
          ),
          (!maxCount || arrayLength < maxCount) && (
            <Components.FormNestedFoot
              key="add-button"
              addItem={this.addItem}
              label={this.props.label}
            />
          ),
          hasErrors ? (
            <Components.FieldErrors
              key="form-nested-errors"
              errors={nestedArrayErrors}
            />
          ) : null
        ]}
      />
    );
  }
}

(FormNestedArray as any).propTypes = {
  currentValues: PropTypes.object,
  path: PropTypes.string,
  label: PropTypes.string,
  minCount: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.func
  ]),
  maxCount: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.func
  ]),
  errors: PropTypes.array.isRequired,
  deletedValues: PropTypes.array.isRequired,
  formComponents: PropTypes.object.isRequired
};

const FormNestedArrayComponent = registerComponent('FormNestedArray', FormNestedArray);

const IconAdd = ({ width = 24, height = 24 }) => (
  <svg
    width={width}
    height={height}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
  >
    <path d="M448 294.2v-76.4c0-13.3-10.7-24-24-24H286.2V56c0-13.3-10.7-24-24-24h-76.4c-13.3 0-24 10.7-24 24v137.8H24c-13.3 0-24 10.7-24 24v76.4c0 13.3 10.7 24 24 24h137.8V456c0 13.3 10.7 24 24 24h76.4c13.3 0 24-10.7 24-24V318.2H424c13.3 0 24-10.7 24-24z" />
  </svg>
);

const IconAddComponent = registerComponent('IconAdd', IconAdd);

const IconRemove = ({ width = 24, height = 24 }) => (
  <svg
    width={width}
    height={height}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
  >
    <path d="M424 318.2c13.3 0 24-10.7 24-24v-76.4c0-13.3-10.7-24-24-24H24c-13.3 0-24 10.7-24 24v76.4c0 13.3 10.7 24 24 24h400z" />
  </svg>
);

const IconRemoveComponent = registerComponent('IconRemove', IconRemove);

declare global {
  interface ComponentTypes {
    FormNestedArrayLayout: typeof FormNestedArrayLayoutComponent
    FormNestedArray: typeof FormNestedArrayComponent
    IconAdd: typeof IconAddComponent
    IconRemove: typeof IconRemoveComponent
  }
}
