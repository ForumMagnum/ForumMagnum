import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, mergeWithComponents, registerComponent } from '../../lib/vulcan-lib/components';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import SimpleSchema from 'simpl-schema';
import { isEmptyValue, getNullValue } from '../../lib/vulcan-forms/utils';
import LWTooltip from "@/components/common/LWTooltip";
import { FormNestedArray } from "@/components/vulcan-forms/FormNestedArray";

interface FormComponentState {
  charsRemaining?: number
  charsCount?: number
}

class FormComponent<T extends DbObject> extends Component<FormComponentWrapperProps<T>,FormComponentState> {
  declare context: AnyBecauseTodo

  constructor(props: FormComponentWrapperProps<T>) {
    super(props);

    this.state = {};
  }

  UNSAFE_componentWillMount() {
    if (this.showCharsRemaining()) {
      const value = this.getValue();
      this.updateCharacterCount(value);
    }
  }

  shouldComponentUpdate(nextProps: FormComponentWrapperProps<T>, nextState: FormComponentState) {
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
    const charsChanged = nextState.charsRemaining !== this.state.charsRemaining;
    const disabledChanged = nextProps.disabled !== this.props.disabled;

    const shouldUpdate =
      valueChanged ||
      errorChanged ||
      deleteChanged ||
      charsChanged ||
      disabledChanged;

    return shouldUpdate;
  }

  /*

  If this is an intl input, get _intl field instead

  */
  getPath = (props?: FormComponentWrapperProps<T>) => {
    const p = props || this.props;
    return p.path;
  };

  /*
  
  Returns true if the passed input type is a custom 
  
  */
  isCustomInput = (inputType: FormInputType) => {
    const isStandardInput = [
      'nested',
      'number',
      'url',
      'email',
      'textarea',
      'checkbox',
      'checkboxgroup',
      'select',
      'datetime',
      'date',
      'text'
    ].includes(inputType);
    return !isStandardInput;
  };

  /*
  
  Function passed to form controls (always controlled) to update their value
  
  */
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

    // for text fields, update character count on change
    if (this.showCharsRemaining()) {
      this.updateCharacterCount(value);
    }
  };

  /*
  
  Updates the state of charsCount and charsRemaining as the users types
  
  */
  updateCharacterCount = (value: AnyBecauseTodo) => {
    const characterCount = value ? value.length : 0;
    this.setState({
      charsRemaining: (this.props.max||0) - characterCount,
      charsCount: characterCount
    });
  };

  /*

  Get value from Form state through document and currentValues props

  */
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

  /*

  Whether to keep track of and show remaining chars

  */
  showCharsRemaining = (props?: any) => {
    const p = props || this.props;
    return (
      p.max && ['url', 'email', 'textarea', 'text'].includes(this.getInputType(p))
    );
  };

  /*

  Get errors from Form state through context

  Note: we use `includes` to get all errors from nested components, which have longer paths

  */
  getErrors = (errors?: any) => {
    errors = errors || this.props.errors;
    const fieldErrors = errors.filter(
      (error: AnyBecauseTodo) => error.path && error.path.includes(this.props.path)
    );
    return fieldErrors;
  };

  /*

  Get form input type, either based on input props, or by guessing based on form field type

  */
  getInputType = (props?: any) => {
    const p = props || this.props;
    const fieldType = this.getFieldType();
    const autoType =
      fieldType === Number
        ? 'number'
        : fieldType === Boolean
          ? 'checkbox'
          : fieldType === Date
            ? 'date'
            : 'text';
    return p.input || autoType;
  };

  /*
  
  Function passed to form controls to clear their contents (set their value to null)
  
  */
  clearField = (event: AnyBecauseTodo) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // To avoid issues with non-nullable fields, we set the localgroup multiselect to [] rather than null when cleared
    // @ts-ignore (anything can get passed in to props via the "form" schema value)
    const newVal = (this.props.input === 'SelectLocalgroup' && this.props.multiselect) ? [] : null;
    void this.props.updateCurrentValues({ [this.props.path]: newVal });
    if (this.showCharsRemaining()) {
      this.updateCharacterCount(null);
    }
  };

  /*
  
  Function passed to FormComponentInner to help with rendering the component
  
  */
  getFormInput = () => {
    const inputType = this.getInputType();
    const FormComponents = mergeWithComponents(this.props.formComponents);

    // if input is a React component, use it
    if (typeof this.props.input === 'function') {
      const InputComponent = this.props.input;
      return InputComponent;
    } else {
      // else pick a predefined component

      switch (inputType) {
        case 'text':
          return FormComponents.FormComponentDefault;

        case 'number':
          return FormComponents.FormComponentNumber;

        case 'url':
          return FormComponents.FormComponentUrl;

        case 'email':
          return FormComponents.FormComponentEmail;

        case 'textarea':
          return FormComponents.FormComponentTextarea;

        case 'checkbox':
          return FormComponents.FormComponentCheckbox;

        case 'checkboxgroup':
          return FormComponents.FormComponentCheckboxGroup;

        case 'radiogroup':
          return FormComponents.FormComponentRadioGroup

        case 'select':
          return FormComponents.FormComponentSelect;

        case 'datetime':
          return FormComponents.FormComponentDateTime;

        case 'date':
          return FormComponents.FormComponentDate;

        default:
          if (this.props.input && (FormComponents as AnyBecauseTodo)[this.props.input]) {
            return (FormComponents as AnyBecauseTodo)[this.props.input];
          } else if (this.isArrayField()) {
            return FormNestedArray;
          } else if (this.isObjectField()) {
            return FormComponents.FormNestedObject;
          } else {
            return FormComponents.FormComponentDefault;
          }
      }
    }
  };

  /*

  Get field field value type

  */
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
    const FormComponents = mergeWithComponents(this.props.formComponents);

    if (!this.props.input && this.props.nestedInput) {
      if (this.isArrayField()) {
        return (
          <FormComponents.FormNestedArray
            {...this.props}
            formComponents={FormComponents}
            errors={this.getErrors()}
            value={this.getValue()}
          />
        );
      } else if (this.isObjectField()) {
        return (
          <FormComponents.FormNestedObject
            {...this.props}
            formComponents={FormComponents}
            errors={this.getErrors()}
            value={this.getValue()}
          />
        );
      }
    }

    const formComponent = (
      <FormComponents.FormComponentInner
        {...this.props}
        {...this.state}
        inputType={this.getInputType()}
        value={this.getValue()}
        errors={this.getErrors()}
        document={this.context.getDocument()}
        showCharsRemaining={!!this.showCharsRemaining()}
        onChange={this.handleChange}
        clearField={this.clearField}
        formInput={this.getFormInput()}
        formComponents={FormComponents}
      />
    );

    if (this.props.tooltip) {
      return <div>
        <LWTooltip inlineBlock={false} title={this.props.tooltip} placement="left-start">
          <div>{ formComponent }</div>
        </LWTooltip>
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

export default FormComponentComponent;
