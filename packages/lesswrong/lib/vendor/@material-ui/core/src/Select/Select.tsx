// @inheritedComponent Input

import React, { useContext } from 'react';
import SelectInput, { SelectInputProps } from './SelectInput';
// To replace with InputBase in v4.0.0
import Input from '../Input';
import { formControlState } from '../InputBase/InputBase';
import { StandardProps } from '..';
import { InputProps } from '../Input/Input';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { FormControlContext } from '../FormControl/FormControl';

export interface SelectProps
  extends StandardProps<InputProps, SelectClassKey, 'value' | 'onChange'>,
    Pick<SelectInputProps, 'onChange'> {
  displayEmpty?: boolean;
  input?: React.ReactNode;
  multiple?: boolean;
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

export const styles = defineStyles("MuiSelect", theme => ({
  /* Styles applied to the `Input` component `root` class. */
  root: {
    position: 'relative',
    width: '100%',
  },
  /* Styles applied to the `Input` component `select` class. */
  select: {
    '-moz-appearance': 'none', // Reset
    '-webkit-appearance': 'none', // Reset
    // When interacting quickly, the text can end up selected.
    // Native select can't be selected either.
    userSelect: 'none',
    paddingRight: 32,
    borderRadius: 0, // Reset
    width: 'calc(100% - 32px)',
    minWidth: 16, // So it doesn't collapse.
    cursor: 'pointer',
    '&:focus': {
      // Show that it's not an text input
      background:
        theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
      borderRadius: 0, // Reset Chrome style
    },
    // Remove Firefox focus border
    '&:-moz-focusring': {
      color: 'transparent',
      textShadow: '0 0 0 #000',
    },
    // Remove IE11 arrow
    '&::-ms-expand': {
      display: 'none',
    },
    '&$disabled': {
      cursor: 'default',
    },
  },
  /* Styles applied to the `Input` component if `variant="filled"`. */
  filled: {
    width: 'calc(100% - 44px)',
  },
  /* Styles applied to the `Input` component if `variant="outlined"`. */
  outlined: {
    width: 'calc(100% - 46px)',
    borderRadius: theme.shape.borderRadius,
  },
  /* Styles applied to the `Input` component `selectMenu` class. */
  selectMenu: {
    width: 'auto', // Fix Safari textOverflow
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    minHeight: '1.1875em', // Reset (19px), match the native input line-height
  },
  /* Styles applied to the `Input` component `disabled` class. */
  disabled: {},
  /* Styles applied to the `Input` component `icon` class. */
  icon: {
    // We use a position absolute over a flexbox in order to forward the pointer events
    // to the input.
    position: 'absolute',
    right: 0,
    top: 'calc(50% - 12px)', // Center vertically
    color: theme.palette.action.active,
    'pointer-events': 'none', // Don't block pointer events on the select under the icon.
  },
}), {
  stylePriority: -10,
  allowNonThemeColors: true, // For the -moz-focusring option
});

function Select(props: SelectProps) {
  const {
    children,
    classes: classesOverride,
    displayEmpty=false,
    input=<Input />,
    inputProps,
    multiple=false,
    onClose,
    onOpen,
    open,
    renderValue,
    SelectDisplayProps,
    variant,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverride);
  const muiFormControl = useContext(FormControlContext);

  const inputComponent = SelectInput;
  const fcs = formControlState({
    props,
    muiFormControl,
    states: ['variant'],
  });

  return React.cloneElement(input as AnyBecauseHard, {
    // Most of the logic is implemented in `SelectInput`.
    // The `Select` component is a simple API wrapper to expose something better to play with.
    inputComponent,
    inputProps: {
      children,
      variant: fcs.variant,
      type: undefined, // We render a select. We can ignore the type provided by the `Input`.
      ...({
        displayEmpty,
        multiple,
        onClose,
        onOpen,
        open,
        renderValue,
        SelectDisplayProps,
      }),
      ...inputProps,
      classes,
      ...(input ? (input as AnyBecauseHard).props.inputProps : {}),
    },
    ...other,
  });
}

Select.muiName = 'Select';

export default Select;
