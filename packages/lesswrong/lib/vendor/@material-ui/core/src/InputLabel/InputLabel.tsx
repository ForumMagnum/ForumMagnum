// @inheritedComponent FormLabel

import React, { useContext } from 'react';
import classNames from 'classnames';
import FormLabel from '../FormLabel';
import { formControlState } from '../InputBase/InputBase';
import { StandardProps } from '..';
import { FormLabelProps } from '../FormLabel/FormLabel';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { FormControlContext } from '../FormControl/FormControl';

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

export const styles = defineStyles("MuiInputLabel", theme => ({
  /* Styles applied to the root element. */
  root: {
    transformOrigin: 'top left',
  },
  /* Styles applied to the root element if the component is a descendant of `FormControl`. */
  formControl: {
    position: 'absolute',
    left: 0,
    top: 0,
    // slight alteration to spec spacing to match visual spec result
    transform: 'translate(0, 24px) scale(1)',
  },
  /* Styles applied to the root element if `margin="dense"`. */
  marginDense: {
    // Compensation for the `Input.inputDense` style.
    transform: 'translate(0, 21px) scale(1)',
  },
  /* Styles applied to the `input` element if `shrink={true}`. */
  shrink: {
    transform: 'translate(0, 1.5px) scale(0.75)',
    transformOrigin: 'top left',
  },
  /* Styles applied to the `input` element if `disableAnimation={false}`. */
  animated: {
    transition: theme.transitions.create(['color', 'transform'], {
      duration: theme.transitions.duration.shorter,
      easing: theme.transitions.easing.easeOut,
    }),
  },
  /* Styles applied to the root element if `variant="filled"`. */
  filled: {
    // Chrome's autofill feature gives the input field a yellow background.
    // Since the input field is behind the label in the HTML tree,
    // the input field is drawn last and hides the label with an opaque background color.
    // zIndex: 1 will raise the label above opaque background-colors of input.
    zIndex: 1,
    pointerEvents: 'none',
    transform: 'translate(12px, 22px) scale(1)',
    '&$marginDense': {
      transform: 'translate(12px, 19px) scale(1)',
    },
    '&$shrink': {
      transform: 'translate(12px, 10px) scale(0.75)',
      '&$marginDense': {
        transform: 'translate(12px, 7px) scale(0.75)',
      },
    },
  },
  /* Styles applied to the root element if `variant="outlined"`. */
  outlined: {
    // see comment above on filled.zIndex
    zIndex: 1,
    pointerEvents: 'none',
    transform: 'translate(14px, 22px) scale(1)',
    '&$marginDense': {
      transform: 'translate(14px, 17.5px) scale(1)',
    },
    '&$shrink': {
      transform: 'translate(14px, -6px) scale(0.75)',
    },
  },
}), {stylePriority: -10});

function InputLabel(props: InputLabelProps) {
  const {
    children,
    classes: classesOverride,
    className: classNameProp,
    disableAnimation=false,
    FormLabelClasses,
    shrink: shrinkProp,
    variant: variantProp,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverride);
  const muiFormControl = useContext(FormControlContext);

  let shrink = shrinkProp;
  if (typeof shrink === 'undefined' && muiFormControl) {
    shrink = muiFormControl.filled || muiFormControl.focused || muiFormControl.adornedStart;
  }

  const fcs = formControlState({
    props,
    context,
    states: ['margin', 'variant'],
  });

  const className = classNames(
    classes.root,
    {
      [classes.formControl]: muiFormControl,
      [classes.animated]: !disableAnimation,
      [classes.shrink]: shrink,
      [classes.marginDense]: fcs.margin === 'dense',
      [classes.filled]: fcs.variant === 'filled',
      [classes.outlined]: fcs.variant === 'outlined',
    },
    classNameProp,
  );

  return (
    <FormLabel data-shrink={shrink} className={className} classes={FormLabelClasses} {...other}>
      {children}
    </FormLabel>
  );
}

export default InputLabel;
