/* eslint-disable jsx-a11y/label-has-for */

import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { Typography } from '@/components/common/Typography';
import { FormControlContext } from '../FormControl/FormControl';

export interface FormControlLabelProps
  extends StandardProps<
      React.LabelHTMLAttributes<HTMLLabelElement>,
      FormControlLabelClassKey,
      'onChange'
    > {
  checked?: boolean | string;
  control: React.ReactElement<any>;
  disabled?: boolean;
  inputRef?: React.Ref<any>;
  label: React.ReactNode;
  name?: string;
  onChange?: (event: React.ChangeEvent<{}>, checked: boolean) => void;
  labelPlacement?: 'end' | 'start';
  value?: string;
}

export type FormControlLabelClassKey = 'root' | 'start' | 'disabled' | 'label';

export const styles = defineStyles("MuiFormControlLabel", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    // For correct alignment with the text.
    verticalAlign: 'middle',
    // Remove grey highlight
    WebkitTapHighlightColor: 'transparent',
    marginLeft: -14,
    marginRight: 16, // used for row presentation of radio/checkbox
    '&$disabled': {
      cursor: 'default',
    },
  },
  /* Styles applied to the root element if `labelPlacement="start"`. */
  labelPlacementStart: {
    flexDirection: 'row-reverse',
    marginLeft: 16, // used for row presentation of radio/checkbox
    marginRight: -14,
  },
  /* Styles applied to the root element if `disabled={true}`. */
  disabled: {},
  /* Styles applied to the label's Typography component. */
  label: {
    '&$disabled': {
      color: theme.palette.text.disabled,
    },
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14.3,
    fontWeight: 400,
    lineHeight: "19.5px",
  },
}), {stylePriority: -10});

/**
 * Drop in replacement of the `Radio`, `Switch` and `Checkbox` component.
 * Use this component if you want to display an extra label.
 */
function FormControlLabel(props: FormControlLabelProps) {
  const {
    checked,
    classes: classesOverride,
    className: classNameProp,
    control,
    disabled: disabledProp,
    inputRef,
    label,
    labelPlacement="end",
    name,
    onChange,
    value,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverride);
  const muiFormControl = useContext(FormControlContext);

  let disabled = disabledProp;
  if (typeof disabled === 'undefined' && typeof control.props.disabled !== 'undefined') {
    disabled = control.props.disabled;
  }
  if (typeof disabled === 'undefined' && muiFormControl) {
    disabled = muiFormControl.disabled;
  }

  const controlProps = {
    disabled,
  };
  ['checked', 'name', 'onChange', 'value', 'inputRef'].forEach(key => {
    if (typeof control.props[key] === 'undefined' && typeof props[key] !== 'undefined') {
      controlProps[key] = props[key];
    }
  });

  return (
    <label
      className={classNames(
        classes.root,
        {
          [classes.labelPlacementStart]: labelPlacement === 'start',
          [classes.disabled]: disabled,
        },
        classNameProp,
      )}
      {...other}
    >
      {React.cloneElement(control, controlProps)}
      <Typography
        component="span"
        className={classNames(classes.label, { [classes.disabled]: disabled })}
        variant="body1"
      >
        {label}
      </Typography>
    </label>
  );
}

export default FormControlLabel;
