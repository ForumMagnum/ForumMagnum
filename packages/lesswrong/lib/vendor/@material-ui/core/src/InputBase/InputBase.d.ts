import * as React from 'react';
import { StandardProps } from '..';

export interface InputBaseProps
  extends StandardProps<
      React.HTMLAttributes<HTMLDivElement>,
      InputBaseClassKey,
      'onChange' | 'onKeyUp' | 'onKeyDown' | 'defaultValue'
    > {
  autoComplete?: string;
  autoFocus?: boolean;
  defaultValue?: string | number;
  disabled?: boolean;
  disableUnderline?: boolean;
  endAdornment?: React.ReactNode;
  error?: boolean;
  fullWidth?: boolean;
  id?: string;
  inputComponent?: React.ReactType<InputBaseComponentProps>;
  inputProps?: InputBaseComponentProps;
  inputRef?: React.Ref<any> | React.RefObject<any>;
  margin?: 'dense';
  multiline?: boolean;
  name?: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  rows?: string | number;
  rowsMax?: string | number;
  startAdornment?: React.ReactNode;
  type?: string;
  value?: Array<string | number | boolean> | string | number | boolean;
  /**
   * `onChange`, `onKeyUp` + `onKeyDown` are applied to the inner `InputComponent`,
   * which by default is an input or textarea. Since these handlers differ from the
   * ones inherited by `React.HTMLAttributes<HTMLDivElement>` we need to omit them.
   *
   * Note that  `blur` and `focus` event handler are applied to the outter `<div>`.
   * So these can just be inherited from the native `<div>`.
   */
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLTextAreaElement | HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement | HTMLInputElement>;
}

export interface InputBaseComponentProps extends InputBaseProps {
  // Accommodate arbitrary additional props coming from the `inputProps` prop
  [arbitrary: string]: any;
}

export type InputBaseClassKey =
  | 'root'
  | 'formControl'
  | 'focused'
  | 'disabled'
  | 'error'
  | 'multiline'
  | 'fullWidth'
  | 'input'
  | 'inputMarginDense'
  | 'inputDisabled'
  | 'inputMultiline'
  | 'inputType'
  | 'inputTypeSearch';

declare const InputBase: React.ComponentType<InputBaseProps>;

export default InputBase;
