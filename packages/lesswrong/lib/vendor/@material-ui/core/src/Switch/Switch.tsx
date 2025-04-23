import React from 'react';
import classNames from 'classnames';
import { capitalize } from '../utils/helpers';
import SwitchBase, { SwitchBaseClassKey, SwitchBaseProps } from '../internal/SwitchBase';
import { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface SwitchProps
  extends StandardProps<SwitchBaseProps, SwitchClassKey, 'checkedIcon' | 'color' | 'icon'> {
  checkedIcon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'default';
  icon?: React.ReactNode;
}

export type SwitchClassKey =
  | SwitchBaseClassKey
  | 'bar'
  | 'icon'
  | 'iconChecked'
  | 'switchBase'
  | 'colorPrimary'
  | 'colorSecondary';


export const styles = defineStyles("MuiSwitch", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'inline-flex',
    width: 62,
    position: 'relative',
    flexShrink: 0,
    // For correct alignment with the text.
    verticalAlign: 'middle',
  },
  /* Styles used to create the `icon` passed to the internal `SwitchBase` component `icon` prop. */
  icon: {
    boxShadow: theme.shadows[1],
    backgroundColor: 'currentColor',
    width: 20,
    height: 20,
    borderRadius: '50%',
  },
  /* Styles applied the icon element component if `checked={true}`. */
  iconChecked: {
    boxShadow: theme.shadows[2],
  },
  /* Styles applied to the internal `SwitchBase` component's `root` class. */
  switchBase: {
    zIndex: 1,
    padding: 0,
    height: 48,
    width: 48,
    color: theme.palette.type === 'light' ? theme.palette.grey[50] : theme.palette.grey[400],
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  /* Styles applied to the internal `SwitchBase` component's `checked` class. */
  checked: {
    transform: 'translateX(14px)',
    '& + $bar': {
      opacity: 0.5,
    },
  },
  /* Styles applied to the internal SwitchBase component's root element if `color="primary"`. */
  colorPrimary: {
    '&$checked': {
      color: theme.palette.primary.main,
      '& + $bar': {
        backgroundColor: theme.palette.primary.main,
      },
    },
  },
  /* Styles applied to the internal SwitchBase component's root element if `color="secondary"`. */
  colorSecondary: {
    '&$checked': {
      color: theme.palette.secondary.main,
      '& + $bar': {
        backgroundColor: theme.palette.secondary.main,
      },
    },
  },
  /* Styles applied to the internal SwitchBase component's disabled class. */
  disabled: {
    '& + $bar': {
      opacity: theme.palette.type === 'light' ? 0.12 : 0.1,
    },
    '& $icon': {
      boxShadow: theme.shadows[1],
    },
    '&$switchBase': {
      color: theme.palette.type === 'light' ? theme.palette.grey[400] : theme.palette.grey[800],
      '& + $bar': {
        backgroundColor:
          theme.palette.type === 'light' ? theme.palette.common.black : theme.palette.common.white,
      },
    },
  },
  /* Styles applied to the bar element. */
  bar: {
    borderRadius: 14 / 2,
    display: 'block',
    position: 'absolute',
    width: 34,
    height: 14,
    top: '50%',
    left: '50%',
    marginTop: -7,
    marginLeft: -17,
    transition: theme.transitions.create(['opacity', 'background-color'], {
      duration: theme.transitions.duration.shortest,
    }),
    backgroundColor:
      theme.palette.type === 'light' ? theme.palette.common.black : theme.palette.common.white,
    opacity: theme.palette.type === 'light' ? 0.38 : 0.3,
  },
}), {stylePriority: -10});

function Switch(props: SwitchProps) {
  const { classes: classesOverride, className, color, ...other } = props;
  const classes = useStyles(styles, classesOverride);

  return (
    <span className={classNames(classes.root, className)}>
      <SwitchBase
        type="checkbox"
        icon={<span className={classes.icon} />}
        classes={{
          root: classNames(classes.switchBase, {
            [classes.colorPrimary]: color==='primary',
            [classes.colorSecondary]: color==='secondary',
          }),
          checked: classes.checked,
          disabled: classes.disabled,
        }}
        checkedIcon={<span className={classNames(classes.icon, classes.iconChecked)} />}
        {...other}
      />
      <span className={classes.bar} />
    </span>
  );
}

Switch.defaultProps = {
  color: 'secondary',
};

export default Switch;
