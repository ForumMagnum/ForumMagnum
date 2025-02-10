import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import SimpleSchema from 'simpl-schema';
import { isEmptyValue, getNullValue } from '../../lib/vulcan-forms/utils';

class FormComponent<T extends DbObject> extends Component<FormComponentWrapperProps<T>> {
  declare context: AnyBecauseTodo

  constructor(props: FormComponentWrapperProps<T>) {
    super(props);
    this.state = {};
  }

  shouldComponentUpdate(nextProps: FormComponentWrapperProps<T>) {
    // allow custom controls to determine if they should update
    if (this.isCustomInput(this.getInputType(nextProps))) {
      return true;
    }

    const { currentValues, deletedValues, errors } = nextProps;
    const path = this.getPath(this.props);

    // when checking for deleted values, both current path ('foo') and child path ('foo.0.bar') should trigger updates
    const includesPathOrChildren = (deletedValues: AnyBecauseTodo) =>
      deletedValues.some((deletedPath: AnyBecauseTodo) => deletedPath.includes(path));

    const valueChanged =
      !isEqual(get(currentValues, path), get(this.props.currentValues, path)); 
    const errorChanged = !isEqual(this.getErrors(errors), this.getErrors());
    const deleteChanged =
      includesPathOrChildren(deletedValues) !==
      includesPathOrChildren(this.props.deletedValues);
    const disabledChanged = nextProps.disabled !== this.props.disabled;

    const shouldUpdate =
      valueChanged ||
      errorChanged ||
      deleteChanged ||
      disabledChanged;

    return shouldUpdate;
  }

  // If this is an intl input, get _intl field instead
  getPath = (props?: FormComponentWrapperProps<T>) => {
    const p = props || this.props;
    return p.path;
  };

  // Returns true if the passed input type is a custom 
  isCustomInput = (inputType: FormInputType) => {
    const isStandardInput = [
      'nested',
      'number',
      'checkbox',
      'checkboxgroup',
      'select',
      'datetime',
      'date',
      'text'
    ].includes(inputType);
    return !isStandardInput;
  };

  // Function passed to form controls (always controlled) to update their value
  handleChange = (value: AnyBecauseTodo) => {

    // if value is an empty string, delete the field
    if (value === '') {
      value = null;
    }
    // if this is a number field, convert value before sending it up to Form
    if (this.getFieldType() === Number && value != null) {
      value = Number(value);
    }

    const updateValue = this.props.locale
      ? { locale: this.props.locale, value }
      : value;
    void this.props.updateCurrentValues({ [this.getPath()]: updateValue });
  };

  // Get value from Form state through document and currentValues props
  getValue = (props?: any, context?: any) => {
    const p = props || this.props;
    const c = context || this.context;
    const { locale, defaultValue, deletedValues, formType, datatype } = p;
    const path = locale ? `${this.getPath(p)}.value` : this.getPath(p);
    const currentDocument = c.getDocument();
    let value = get(currentDocument, path);
    // note: force intl fields to be treated like strings
    const nullValue = locale ? '' : getNullValue(datatype);

    // handle deleted & empty value
    if (deletedValues.includes(path)) {
      value = nullValue;
    } else if (isEmptyValue(value)) {
      // replace empty value by the default value from the schema if it exists – for new forms only
      value = formType === 'new' && defaultValue ? defaultValue : nullValue;
    }
    return value;
  };

  // Get errors from Form state through context
  //
  // Note: we use `includes` to get all errors from nested components, which have longer paths
  getErrors = (errors?: any) => {
    errors = errors || this.props.errors;
    const fieldErrors = errors.filter(
      (error: AnyBecauseTodo) => error.path && error.path.includes(this.props.path)
    );
    return fieldErrors;
  };

  // Get form input type, either based on input props, or by guessing based on form field type
  getInputType = (props?: any) => {
    const p = props || this.props;
    if (p.input) return p.input;

    const fieldType = this.getFieldType();
    if (fieldType === Number) return "number";
    else if (fieldType === Boolean) return "checkbox";
    else if (fieldType === Date) return 'date';
    else return 'text';
  };

  // Function passed to form controls to clear their contents (set their value to null)
  clearField = (event: AnyBecauseTodo) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // To avoid issues with non-nullable fields, we set the localgroup multiselect to [] rather than null when cleared
    // @ts-ignore (anything can get passed in to props via the "form" schema value)
    const newVal = (this.props.input === 'SelectLocalgroup' && this.props.multiselect) ? [] : null;
    void this.props.updateCurrentValues({ [this.props.path]: newVal });
  };

  // Function passed to FormComponentInner to help with rendering the component
  getFormInput = () => {
    const inputType = this.getInputType();

    // if input is a React component, use it
    if (typeof this.props.input === 'function') {
      const InputComponent = this.props.input;
      return InputComponent;
    } else {
      // else pick a predefined component

      switch (inputType) {
        case 'text':
          return Components.FormComponentDefault;

        case 'number':
          return Components.FormComponentNumber;

        case 'checkbox':
          return Components.FormComponentCheckbox;

        case 'checkboxgroup':
          return Components.FormComponentCheckboxGroup;

        case 'radiogroup':
          return Components.FormComponentRadioGroup

        case 'select':
          return Components.FormComponentSelect;

        case 'datetime':
          return Components.FormComponentDateTime;

        case 'date':
          return Components.FormComponentDate;

        default:
          if (this.props.input && (Components as AnyBecauseTodo)[this.props.input]) {
            return (Components as AnyBecauseTodo)[this.props.input];
          } else if (this.isArrayField()) {
            return Components.FormNestedArray;
          } else if (this.isObjectField()) {
            return Components.FormNestedObject;
          } else {
            return Components.FormComponentDefault;
          }
      }
    }
  };

  // Get field field value type
  getFieldType = () => {
    return this.props.datatype[0].type;
  };
  isArrayField = () => {
    return this.getFieldType() === Array;
  };
  isObjectField = () => {
    return this.getFieldType() instanceof SimpleSchema;
  };
  render() {
    if (!this.props.input && this.props.nestedInput) {
      if (this.isArrayField()) {
        return (
          <Components.FormNestedArray
            {...this.props}
            formComponents={this.props.formComponents}
            errors={this.getErrors()}
            value={this.getValue()}
          />
        );
      } else if (this.isObjectField()) {
        return (
          <Components.FormNestedObject
            {...this.props}
            formComponents={this.props.formComponents}
            errors={this.getErrors()}
          />
        );
      }
    }

    const formComponent = (
      <Components.FormComponentInner
        {...this.props}
        inputType={this.getInputType()}
        value={this.getValue()}
        errors={this.getErrors()}
        document={this.context.getDocument()}
        onChange={this.handleChange}
        clearField={this.clearField}
        formInput={this.getFormInput()}
        formComponents={this.props.formComponents}
      />
    );

    if (this.props.tooltip) {
      return <div>
        <Components.LWTooltip inlineBlock={false} title={this.props.tooltip} placement="left-start">
          <div>{ formComponent }</div>
        </Components.LWTooltip>
      </div>
    } else {
      return formComponent;
    }
  }
}

(FormComponent as any).contextTypes = {
  getDocument: PropTypes.func.isRequired
};

const FormComponentComponent = registerComponent('FormComponent', FormComponent);

declare global {
  interface ComponentTypes {
    FormComponent: typeof FormComponentComponent
  }
}
