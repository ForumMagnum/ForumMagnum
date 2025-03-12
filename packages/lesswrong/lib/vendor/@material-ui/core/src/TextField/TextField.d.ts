import * as React from 'react';
import { StandardProps, PropTypes } from '..';
import { FormControlClassKey, FormControlProps } from '../FormControl';
import { FormHelperTextProps } from '../FormHelperText';
import { InputProps } from '../Input';
import { InputLabelProps } from '../InputLabel';
import { SelectProps } from '../Select';

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
  margin?: PropTypes.Margin;
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

declare const TextField: React.ComponentType<TextFieldProps>;

export default TextField;
