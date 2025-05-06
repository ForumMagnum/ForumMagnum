// @inheritedComponent InputBase

import React from 'react';
import classNames from 'classnames';
import InputBase from '../InputBase';
import NotchedOutline from './NotchedOutline';
import { StandardProps } from '..';
import { InputBaseProps } from '../InputBase/InputBase';
import { defineStyles, useStylesNonProxy } from '@/components/hooks/useStyles';

export interface OutlinedInputProps extends StandardProps<InputBaseProps, OutlinedInputClassKey> {
  notched?: boolean;
  labelWidth: number;
}

export type OutlinedInputClassKey =
  | 'root'
  | 'focused'
  | 'disabled'
  | 'adornedStart'
  | 'adornedEnd'
  | 'error'
  | 'multiline'
  | 'notchedOutline'
  | 'input'
  | 'inputMarginDense'
  | 'inputMultiline'
  | 'inputAdornedStart'
  | 'inputAdornedEnd';

export const styles = defineStyles("MuiOutlinedInput", theme => {
  return {
    /* Styles applied to the root element. */
    root: {
      position: 'relative',
      '&:hover:not($disabled):not($focused):not($error) $notchedOutline': {
        borderColor: theme.palette.text.primary,
      },
    },
    /* Styles applied to the root element if the component is focused. */
    focused: {},
    /* Styles applied to the root element if `disabled={true}`. */
    disabled: {},
    /* Styles applied to the root element if `startAdornment` is provided. */
    adornedStart: {
      paddingLeft: 14,
    },
    /* Styles applied to the root element if `endAdornment` is provided. */
    adornedEnd: {
      paddingRight: 14,
    },
    /* Styles applied to the root element if `error={true}`. */
    error: {},
    /* Styles applied to the root element if `multiline={true}`. */
    multiline: {
      padding: '18.5px 14px',
      boxSizing: 'border-box', // Prevent padding issue with fullWidth.
    },
    /* Styles applied to the `NotchedOutline` element. */
    notchedOutline: {},
    /* Styles applied to the `input` element. */
    input: {
      padding: '18.5px 14px',
    },
    /* Styles applied to the `input` element if `margin="dense"`. */
    inputMarginDense: {
      paddingTop: 15,
      paddingBottom: 15,
    },
    /* Styles applied to the `input` element if `multiline={true}`. */
    inputMultiline: {
      padding: 0,
    },
    /* Styles applied to the `input` element if `startAdornment` is provided. */
    inputAdornedStart: {
      paddingLeft: 0,
    },
    /* Styles applied to the `input` element if `endAdornment` is provided. */
    inputAdornedEnd: {
      paddingRight: 0,
    },
    underline: {},
  };
}, {stylePriority: -10});

function OutlinedInput(props: OutlinedInputProps) {
  const {
    classes: classesOverride,
    labelWidth,
    notched,
    fullWidth=false,
    inputComponent='input',
    multiline=false,
    type='text',
    ...other
  } = props;
  const classes = useStylesNonProxy(styles, classesOverride);

  return (
    <InputBase
      renderPrefix={state => (
        <NotchedOutline
          className={classes.notchedOutline}
          disabled={state.disabled}
          error={state.error}
          focused={state.focused}
          labelWidth={labelWidth}
          notched={
            typeof notched !== 'undefined'
              ? notched
              : Boolean(state.startAdornment || state.filled || state.focused)
          }
        />
      )}
      classes={{
        ...classes,
        root: classNames(classes.root, classes.underline, {}),
        notchedOutline: undefined,
      }}
      fullWidth={fullWidth}
      inputComponent={inputComponent}
      multiline={multiline}
      type={type}
      {...other}
    />
  );
}

OutlinedInput.muiName = 'Input';

export default OutlinedInput;
