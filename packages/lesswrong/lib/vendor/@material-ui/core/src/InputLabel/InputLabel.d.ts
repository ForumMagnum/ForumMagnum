import * as React from 'react';
import { StandardProps } from '..';
import { FormLabelProps } from '../FormLabel';

export interface InputLabelProps extends StandardProps<FormLabelProps, InputLabelClassKey> {
  disableAnimation?: boolean;
  disabled?: boolean;
  error?: boolean;
  FormLabelClasses?: FormLabelProps['classes'];
  focused?: boolean;
  required?: boolean;
  shrink?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
}

export type InputLabelClassKey =
  | 'root'
  | 'formControl'
  | 'marginDense'
  | 'shrink'
  | 'animated'
  | 'contained'
  | 'filled'
  | 'outlined';

declare const InputLabel: React.ComponentType<InputLabelProps>;

export default InputLabel;
