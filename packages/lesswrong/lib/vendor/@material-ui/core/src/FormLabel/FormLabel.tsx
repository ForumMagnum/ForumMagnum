import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { formControlState } from '../InputBase/InputBase';
import { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { FormControlContext } from '../FormControl/FormControl';

export interface FormLabelProps extends StandardProps<FormLabelBaseProps, FormLabelClassKey> {
  component?: React.ComponentType<FormLabelBaseProps>;
  disabled?: boolean;
  error?: boolean;
  filled?: boolean;
  focused?: boolean;
  required?: boolean;
  children: React.ReactNode
}

export type FormLabelBaseProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export type FormLabelClassKey =
  | 'root'
  | 'focused'
  | 'disabled'
  | 'error'
  | 'filled'
  | 'required'
  | 'asterisk';

export const styles = defineStyles("MuiFormLabel", theme => ({
  /* Styles applied to the root element. */
  root: {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.secondary,
    fontSize: theme.typography.pxToRem(16),
    lineHeight: 1,
    padding: 0,
    '&$focused': {
      color: theme.palette.primary[theme.palette.type === 'light' ? 'dark' : 'light'],
    },
    '&$disabled': {
      color: theme.palette.text.disabled,
    },
    '&$error': {
      color: theme.palette.error.main,
    },
  },
  /* Styles applied to the root element if `focused={true}`. */
  focused: {},
  /* Styles applied to the root element if `disabled={true}`. */
  disabled: {},
  /* Styles applied to the root element if `error={true}`. */
  error: {},
  /* Styles applied to the root element if `filled={true}`. */
  filled: {},
  /* Styles applied to the root element if `required={true}`. */
  required: {},
  asterisk: {
    '&$error': {
      color: theme.palette.error.main,
    },
  },
}), {stylePriority: -10});

function FormLabel(props: FormLabelProps) {
  const {
    children,
    classes: classesOverride,
    className: classNameProp,
    component: Component = 'label',
    disabled,
    error,
    filled,
    focused,
    required,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverride);
  const { muiFormControl } = useContext(FormControlContext);

  const fcs = formControlState({
    props,
    context: {muiFormControl},
    states: ['required', 'focused', 'disabled', 'error', 'filled'],
  });

  return (
    <Component
      className={classNames(
        classes.root,
        {
          [classes.disabled]: fcs.disabled,
          [classes.error]: fcs.error,
          [classes.filled]: fcs.filled,
          [classes.focused]: fcs.focused,
          [classes.required]: fcs.required,
        },
        classNameProp,
      )}
      {...other}
    >
      {children}
      {fcs.required && (
        <span
          className={classNames(classes.asterisk, {
            [classes.error]: fcs.error,
          })}
          data-mui-test="FormLabelAsterisk"
        >
          {'\u2009*'}
        </span>
      )}
    </Component>
  );
}

export default FormLabel;
