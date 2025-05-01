import React from 'react';
import classNames from 'classnames';
import SwitchBase, { SwitchBaseClassKey, SwitchBaseProps } from '../internal/SwitchBase';
import CheckBoxOutlineBlankIcon from '../internal/svg-icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '../internal/svg-icons/CheckBox';
import IndeterminateCheckBoxIcon from '../internal/svg-icons/IndeterminateCheckBox';
import type { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface CheckboxProps
  extends StandardProps<SwitchBaseProps, CheckboxClassKey, 'checkedIcon' | 'color' | 'icon'> {
  checkedIcon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'default';
  icon?: React.ReactNode;
  indeterminateIcon?: React.ReactNode;
}

export type CheckboxClassKey =
  | SwitchBaseClassKey
  | 'colorPrimary'
  | 'colorSecondary';

export const styles = defineStyles("MuiCheckbox", theme => ({
  /* Styles applied to the root element. */
  root: {
    color: theme.palette.text.secondary,
  },
  /* Styles applied to the root element if `checked={true}`. */
  checked: {},
  /* Styles applied to the root element if `disabled={true}`. */
  disabled: {},
  /* Styles applied to the root element if `color="primary"`. */
  colorPrimary: {
    '&$checked': {
      color: theme.palette.primary.main,
    },
    '&$disabled': {
      color: theme.palette.action.disabled,
    },
  },
  /* Styles applied to the root element if `color="secondary"`. */
  colorSecondary: {
    '&$checked': {
      color: theme.palette.secondary.main,
    },
    '&$disabled': {
      color: theme.palette.action.disabled,
    },
  },
}), {stylePriority: -10});

function Checkbox(props: CheckboxProps) {
  const {
    checkedIcon=<CheckBoxIcon />,
    classes: classesOverride,
    className,
    color='secondary',
    icon=<CheckBoxOutlineBlankIcon />,
    indeterminateIcon=<IndeterminateCheckBoxIcon />,
    inputProps,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverride);

  return (
    <SwitchBase
      type="checkbox"
      checkedIcon={checkedIcon}
      className={classNames(className)}
      classes={{
        root: classNames(classes.root, {
          [classes.colorPrimary]: color==='primary',
          [classes.colorSecondary]: color==='secondary',
        }),
        checked: classes.checked,
        disabled: classes.disabled,
      }}
      icon={icon}
      {...other}
    />
  );
}

export default Checkbox;
