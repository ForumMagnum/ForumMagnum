// @inheritedComponent InputBase

import React from 'react';
import classNames from 'classnames';
import InputBase from '../InputBase';
import { StandardProps } from '..';
import { InputBaseProps } from '../InputBase/InputBase';
import { defineStyles, useStyles, useStylesNonProxy } from '@/components/hooks/useStyles';

export interface FilledInputProps extends StandardProps<InputBaseProps, FilledInputClassKey> {}

export type FilledInputClassKey =
  | 'root'
  | 'underline'
  | 'focused'
  | 'disabled'
  | 'adornedStart'
  | 'adornedEnd'
  | 'error'
  | 'multiline'
  | 'input'
  | 'inputMarginDense'
  | 'inputMultiline'
  | 'inputAdornedStart'
  | 'inputAdornedEnd';

export const styles = defineStyles("MuiFilledInput", theme => {
  const light = theme.palette.type === 'light';
  const bottomLineColor = light ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.7)';

  return {
    /* Styles applied to the root element. */
    root: {
      position: 'relative',
      backgroundColor: light ? 'rgba(0, 0, 0, 0.09)' : 'rgba(255, 255, 255, 0.09)',
      borderTopLeftRadius: theme.shape.borderRadius,
      borderTopRightRadius: theme.shape.borderRadius,
      transition: theme.transitions.create('background-color', {
        duration: theme.transitions.duration.shorter,
        easing: theme.transitions.easing.easeOut,
      }),
      '&:hover': {
        backgroundColor: light ? 'rgba(0, 0, 0, 0.13)' : 'rgba(255, 255, 255, 0.13)',
      },
      '&$focused': {
        backgroundColor: light ? 'rgba(0, 0, 0, 0.09)' : 'rgba(255, 255, 255, 0.09)',
      },
      '&$disabled': {
        backgroundColor: light ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      },
    },
    /* Styles applied to the root element. */
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
        borderBottom: `1px solid ${theme.palette.text.primary}`,
      },
      '&$disabled:before': {
        borderBottom: `1px dotted ${bottomLineColor}`,
      },
    },
    /* Styles applied to the root element if the component is focused. */
    focused: {},
    /* Styles applied to the root element if `disabled={true}`. */
    disabled: {},
    /* Styles applied to the root element if `startAdornment` is provided. */
    adornedStart: {
      paddingLeft: 12,
    },
    /* Styles applied to the root element if `endAdornment` is provided. */
    adornedEnd: {
      paddingRight: 12,
    },
    /* Styles applied to the root element if `error={true}`. */
    error: {},
    /* Styles applied to the root element if `multiline={true}`. */
    multiline: {
      padding: '27px 12px 10px',
      boxSizing: 'border-box', // Prevent padding issue with fullWidth.
    },
    /* Styles applied to the `input` element. */
    input: {
      padding: '27px 12px 10px',
    },
    /* Styles applied to the `input` element if `margin="dense"`. */
    inputMarginDense: {
      paddingTop: 24,
      paddingBottom: 6,
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
  };
}, {stylePriority: -10});

function FilledInput(props: FilledInputProps) {
  const { classes: classesOverride, ...other } = props;
  const classes = useStylesNonProxy(styles, classesOverride);

  return (
    <InputBase
      classes={{
        ...classes,
        root: classNames(classes.root, classes.underline, {}),
        underline: undefined,
      }}
      {...other}
    />
  );
}

InputBase.defaultProps = {
  fullWidth: false,
  inputComponent: 'input',
  multiline: false,
  type: 'text',
};

FilledInput.muiName = 'Input';

export default FilledInput;
