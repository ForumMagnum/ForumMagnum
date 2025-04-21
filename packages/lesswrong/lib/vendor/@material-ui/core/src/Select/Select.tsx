// @inheritedComponent Input

import React from 'react';
import PropTypes from 'prop-types';
import SelectInput, { SelectInputProps } from './SelectInput';
import mergeClasses from '../styles/mergeClasses';
import ArrowDropDownIcon from '../internal/svg-icons/ArrowDropDown';
// To replace with InputBase in v4.0.0
import Input from '../Input';
import { formControlState } from '../InputBase/InputBase';
import { styles as nativeSelectStyles } from '../NativeSelect/NativeSelect';
import NativeSelectInput from '../NativeSelect/NativeSelectInput';
import { StandardProps } from '..';
import { InputProps } from '../Input/Input';
import { MenuProps } from '../Menu/Menu';
import { useStyles } from '@/components/hooks/useStyles';

export interface SelectProps
  extends StandardProps<InputProps, SelectClassKey, 'value' | 'onChange'>,
    Pick<SelectInputProps, 'onChange'> {
  autoWidth?: boolean;
  displayEmpty?: boolean;
  IconComponent?: React.ComponentType;
  input?: React.ReactNode;
  MenuProps?: Partial<MenuProps>;
  multiple?: boolean;
  native?: boolean;
  onClose?: (event: React.ChangeEvent<{}>) => void;
  onOpen?: (event: React.ChangeEvent<{}>) => void;
  open?: boolean;
  renderValue?: (value: SelectProps['value']) => React.ReactNode;
  SelectDisplayProps?: React.HTMLAttributes<HTMLDivElement>;
  value?: Array<string | number | boolean> | string | number | boolean;
  variant?: 'standard' | 'outlined' | 'filled';
}

export type SelectClassKey =
  | 'root'
  | 'select'
  | 'selectMenu'
  | 'disabled'
  | 'icon'
  | 'filled'
  | 'outlined';

export const styles = nativeSelectStyles;

function Select(props: SelectProps, context) {
  const {
    autoWidth,
    children,
    classes: classesOverride,
    displayEmpty,
    IconComponent,
    input,
    inputProps,
    MenuProps,
    multiple,
    native,
    onClose,
    onOpen,
    open,
    renderValue,
    SelectDisplayProps,
    variant,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverride);

  const inputComponent = native ? NativeSelectInput : SelectInput;
  const fcs = formControlState({
    props,
    context,
    states: ['variant'],
  });

  return React.cloneElement(input, {
    // Most of the logic is implemented in `SelectInput`.
    // The `Select` component is a simple API wrapper to expose something better to play with.
    inputComponent,
    inputProps: {
      children,
      IconComponent,
      variant: fcs.variant,
      type: undefined, // We render a select. We can ignore the type provided by the `Input`.
      ...(native
        ? {}
        : {
            autoWidth,
            displayEmpty,
            MenuProps,
            multiple,
            onClose,
            onOpen,
            open,
            renderValue,
            SelectDisplayProps,
          }),
      ...inputProps,
      classes: inputProps
        ? mergeClasses({
            baseClasses: classes,
            newClasses: inputProps.classes,
            Component: Select,
          })
        : classes,
      ...(input ? input.props.inputProps : {}),
    },
    ...other,
  });
}

Select.defaultProps = {
  autoWidth: false,
  displayEmpty: false,
  IconComponent: ArrowDropDownIcon,
  input: <Input />,
  multiple: false,
  native: false,
};

Select.contextTypes = {
  muiFormControl: PropTypes.object,
};

Select.muiName = 'Select';

export default Select;
