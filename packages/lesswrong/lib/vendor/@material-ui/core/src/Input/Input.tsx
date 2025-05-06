// @inheritedComponent InputBase

import React from 'react';
import classNames from 'classnames';
import InputBase from '../InputBase';
import { StandardProps } from '..';
import { InputBaseProps } from '../InputBase/InputBase';
import { defineStyles, useStyles, useStylesNonProxy } from '@/components/hooks/useStyles';

export interface InputProps extends StandardProps<InputBaseProps, InputClassKey> {}

export type InputClassKey =
  | 'root'
  | 'formControl'
  | 'focused'
  | 'disabled'
  | 'underline'
  | 'error'
  | 'multiline'
  | 'fullWidth'
  | 'input'
  | 'inputMarginDense'
  | 'inputMultiline'
  | 'inputType'
  | 'inputTypeSearch';

export const styles = defineStyles("MuiInput", theme => {
  const light = theme.palette.type === 'light';
  const bottomLineColor = light ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.7)';

  return {
    /* Styles applied to the root element. */
    root: {
      position: 'relative',
    },
    /* Styles applied to the root element if the component is a descendant of `FormControl`. */
    formControl: {
      'label + &': {
        marginTop: 16,
      },
    },
    /* Styles applied to the root element if the component is focused. */
    focused: {},
    /* Styles applied to the root element if `disabled={true}`. */
    disabled: {},
    /* Styles applied to the root element if `disableUnderline={false}`. */
    underline: {
      '&:after': {
        borderBottom: `2px solid ${theme.palette.primary[light ? 'dark' : 'light']}`,
        left: 0,
        bottom: 0,
        // Doing the other way around crash on IE11 "''" https://github.com/cssinjs/jss/issues/242
        content: '""',
        position: 'absolute',
        right: 0,
        transform: 'scaleX(0)',
        transition: theme.transitions.create('transform', {
          duration: theme.transitions.duration.shorter,
          easing: theme.transitions.easing.easeOut,
        }),
        pointerEvents: 'none', // Transparent to the hover style.
      },
      '&$focused:after': {
        transform: 'scaleX(1)',
      },
      '&$error:after': {
        borderBottomColor: theme.palette.error.main,
        transform: 'scaleX(1)', // error is always underlined in red
      },
      '&:before': {
        borderBottom: `1px solid ${bottomLineColor}`,
        left: 0,
        bottom: 0,
        // Doing the other way around crash on IE11 "''" https://github.com/cssinjs/jss/issues/242
        content: '"\\00a0"',
        position: 'absolute',
        right: 0,
        transition: theme.transitions.create('border-bottom-color', {
          duration: theme.transitions.duration.shorter,
        }),
        pointerEvents: 'none', // Transparent to the hover style.
      },
      '&:hover:not($disabled):not($focused):not($error):before': {
        borderBottom: `2px solid ${theme.palette.text.primary}`,
      },
      '&$disabled:before': {
        borderBottom: `1px dotted ${bottomLineColor}`,
      },
    },
    /* Styles applied to the root element if `error={true}`. */
    error: {},
    /* Styles applied to the root element if `multiline={true}`. */
    multiline: {},
    /* Styles applied to the root element if `fullWidth={true}`. */
    fullWidth: {},
    /* Styles applied to the `input` element. */
    input: {},
    /* Styles applied to the `input` element if `margin="dense"`. */
    inputMarginDense: {},
    /* Styles applied to the `input` element if `multiline={true}`. */
    inputMultiline: {},
    /* Styles applied to the `input` element if `type` is not "text"`. */
    inputType: {},
    /* Styles applied to the `input` element if `type="search"`. */
    inputTypeSearch: {},
  };
}, {stylePriority: -10});

function Input(props: InputProps) {
  const {
    disableUnderline,
    classes: classesOverride,
    fullWidth=false,
    inputComponent='input',
    multiline=false,
    type='text',
    ...other
  } = props;
  const classes = useStylesNonProxy(styles, classesOverride);

  return (
    <InputBase
      classes={{
        ...classes,
        root: classNames(classes.root, {
          [classes.underline]: !disableUnderline,
        }),
        underline: undefined,
      }}
      fullWidth={fullWidth}
      inputComponent={inputComponent}
      multiline={multiline}
      type={type}
      {...other}
    />
  );
}

Input.muiName = 'Input';

export default Input;
