// @inheritedComponent FormControl

import React from 'react';
import ReactDOM from 'react-dom';
import warning from 'warning';
import Input from '../Input';
import FilledInput from '../FilledInput';
import OutlinedInput from '../OutlinedInput';
import InputLabel from '../InputLabel';
import FormControl from '../FormControl';
import FormHelperText from '../FormHelperText';
import Select from '../Select';
import { StandardProps } from '..';
import { FormControlClassKey, FormControlProps } from '../FormControl/FormControl';
import { FormHelperTextProps } from '../FormHelperText/FormHelperText';
import { InputLabelProps } from '../InputLabel/InputLabel';
import { InputProps } from '../Input/Input';
import { SelectProps } from '../Select/Select';

export interface TextFieldProps
  extends StandardProps<FormControlProps, TextFieldClassKey, 'onChange' | 'defaultValue'> {
  autoComplete?: string;
  autoFocus?: boolean;
  children?: React.ReactNode;
  defaultValue?: string | number;
  disabled?: boolean;
  error?: boolean;
  FormHelperTextProps?: Partial<FormHelperTextProps>;
  fullWidth?: boolean;
  helperText?: React.ReactNode;
  id?: string;
  InputLabelProps?: Partial<InputLabelProps>;
  InputProps?: Partial<InputProps>;
  inputProps?: InputProps['inputProps'];
  inputRef?: React.Ref<any> | React.RefObject<any>;
  label?: React.ReactNode;
  margin?: string;
  multiline?: boolean;
  name?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  placeholder?: string;
  required?: boolean;
  rows?: string | number;
  rowsMax?: string | number;
  select?: boolean;
  SelectProps?: Partial<SelectProps>;
  type?: string;
  value?: Array<string | number | boolean> | string | number | boolean;
  variant?: 'standard' | 'outlined' | 'filled';
}

export type TextFieldClassKey = FormControlClassKey;

const variantComponent = {
  standard: Input,
  filled: FilledInput,
  outlined: OutlinedInput,
};

/**
 * The `TextField` is a convenience wrapper for the most common cases (80%).
 * It cannot be all things to all people, otherwise the API would grow out of control.
 *
 * ## Advanced Configuration
 *
 * It's important to understand that the text field is a simple abstraction
 * on top of the following components:
 * - [FormControl](/api/form-control)
 * - [InputLabel](/api/input-label)
 * - [Input](/api/input)
 * - [FormHelperText](/api/form-helper-text)
 *
 * If you wish to alter the properties applied to the native input, you can do so as follows:
 *
 * ```jsx
 * const inputProps = {
 *   step: 300,
 * };
 *
 * return <TextField id="time" type="time" inputProps={inputProps} />;
 * ```
 *
 * For advanced cases, please look at the source of TextField by clicking on the
 * "Edit this page" button above. Consider either:
 * - using the upper case props for passing values directly to the components
 * - using the underlying components directly as shown in the demos
 */
class TextField extends React.Component<TextFieldProps> {
  labelRef: any
  labelNode: any

  constructor(props: TextFieldProps) {
    super(props);
    this.labelRef = React.createRef();
  }

  componentDidMount() {
    if (this.props.variant === 'outlined') {
      this.labelNode = ReactDOM.findDOMNode(this.labelRef.current);
      this.forceUpdate();
    }
  }

  render() {
    const {
      autoComplete,
      autoFocus,
      children,
      className,
      defaultValue,
      error,
      FormHelperTextProps,
      fullWidth,
      helperText,
      id,
      InputLabelProps,
      inputProps,
      InputProps,
      inputRef,
      label,
      multiline,
      name,
      onBlur,
      onChange,
      onFocus,
      placeholder,
      required=false,
      rows,
      rowsMax,
      select=false,
      SelectProps,
      type,
      value,
      variant="standard",
      ...other
    } = this.props;

    warning(
      !select || Boolean(children),
      'Material-UI: `children` must be passed when using the `TextField` component with `select`.',
    );

    const InputMore: any = {};

    if (variant === 'outlined') {
      if (InputLabelProps && typeof InputLabelProps.shrink !== 'undefined') {
        InputMore.notched = InputLabelProps.shrink;
      }

      InputMore.labelWidth = this.labelNode ? this.labelNode.offsetWidth : 0;
    }

    const helperTextId = helperText && id ? `${id}-helper-text` : undefined;
    const InputComponent = variantComponent[variant];
    const InputElement = (
      <InputComponent
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        defaultValue={defaultValue}
        fullWidth={fullWidth}
        multiline={multiline}
        name={name}
        rows={rows}
        rowsMax={rowsMax}
        type={type}
        value={value}
        id={id}
        inputRef={inputRef}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        placeholder={placeholder}
        inputProps={inputProps}
        {...InputMore}
        {...InputProps}
      />
    );

    return (
      <FormControl
        aria-describedby={helperTextId}
        className={className}
        error={error}
        fullWidth={fullWidth}
        required={required}
        variant={variant}
        {...other}
      >
        {label && (
          <InputLabel htmlFor={id} ref={this.labelRef} {...InputLabelProps}>
            {label}
          </InputLabel>
        )}
        {select ? (
          <Select value={value} input={InputElement} {...SelectProps}>
            {children}
          </Select>
        ) : (
          InputElement
        )}
        {helperText && (
          <FormHelperText id={helperTextId} {...FormHelperTextProps}>
            {helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  }
}

export default TextField;
