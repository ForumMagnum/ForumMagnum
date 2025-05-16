import React from 'react';
import classNames from 'classnames';
import SwitchBase, { SwitchBaseClassKey, SwitchBaseProps } from '../internal/SwitchBase';
import RadioButtonUncheckedIcon from '../internal/svg-icons/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '../internal/svg-icons/RadioButtonChecked';
import { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface RadioProps
  extends StandardProps<SwitchBaseProps, RadioClassKey, 'checkedIcon' | 'color' | 'icon'> {
  checkedIcon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'default';
  icon?: React.ReactNode;
}

export type RadioClassKey = SwitchBaseClassKey | 'colorPrimary' | 'colorSecondary';


export const styles = defineStyles("MuiRadio", theme => ({
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

function Radio(props: RadioProps) {
  const { classes: classesOverride, color, ...other } = props;
  const classes = useStyles(styles, classesOverride);

  return (
    <SwitchBase
      type={"radio" as AnyBecauseHard}
      icon={<RadioButtonUncheckedIcon />}
      checkedIcon={<RadioButtonCheckedIcon />}
      classes={{
        root: classNames(classes.root, {
          [classes.colorPrimary]: color==='primary',
          [classes.colorSecondary]: color==='secondary',
        }),
        checked: classes.checked,
        disabled: classes.disabled,
      }}
      {...other}
    />
  );
}

Radio.defaultProps = {
  color: 'secondary',
};

export default Radio;
