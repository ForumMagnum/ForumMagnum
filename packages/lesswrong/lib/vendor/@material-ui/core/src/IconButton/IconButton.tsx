// @inheritedComponent ButtonBase

import React from 'react';
import classNames from 'classnames';
import { fade } from '../styles/colorManipulator';
import ButtonBase from '../ButtonBase';
import { StandardProps } from '..';
import { ButtonBaseProps } from '../ButtonBase/ButtonBase';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface IconButtonProps extends StandardProps<ButtonBaseProps, IconButtonClassKey> {
  color?: "default"|"inherit"|"primary"|"secondary"
  disabled?: boolean;
  disableRipple?: boolean;
}

export type IconButtonClassKey =
  | 'root'
  | 'colorInherit'
  | 'colorPrimary'
  | 'colorSecondary'
  | 'disabled'
  | 'label';

export const styles = defineStyles("MuiIconButton", theme => ({
  /* Styles applied to the root element. */
  root: {
    textAlign: 'center',
    flex: '0 0 auto',
    fontSize: theme.typography.pxToRem(24),
    padding: 12,
    borderRadius: '50%',
    overflow: 'visible', // Explicitly set the default value to solve a bug on IE11.
    color: theme.palette.action.active,
    transition: theme.transitions.create('background-color', {
      duration: theme.transitions.duration.shortest,
    }),
    '&:hover': {
      backgroundColor: fade(theme.palette.action.active, theme.palette.action.hoverOpacity),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
      '&$disabled': {
        backgroundColor: 'transparent',
      },
    },
    '&$disabled': {
      color: theme.palette.action.disabled,
    },
  },
  /* Styles applied to the root element if `color="inherit"`. */
  colorInherit: {
    color: 'inherit',
  },
  /* Styles applied to the root element if `color="primary"`. */
  colorPrimary: {
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: fade(theme.palette.primary.main, theme.palette.action.hoverOpacity),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
  },
  /* Styles applied to the root element if `color="secondary"`. */
  colorSecondary: {
    color: theme.palette.secondary.main,
    '&:hover': {
      backgroundColor: fade(theme.palette.secondary.main, theme.palette.action.hoverOpacity),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
  },
  /* Styles applied to the root element if `disabled={true}`. */
  disabled: {},
  /* Styles applied to the children container element. */
  label: {
    width: '100%',
    display: 'flex',
    alignItems: 'inherit',
    justifyContent: 'inherit',
  },
}), {stylePriority: -10});

/**
 * Refer to the [Icons](/style/icons) section of the documentation
 * regarding the available icon options.
 */
function IconButton(props: IconButtonProps) {
  const { children, classes: classesOverride, className, color="default", disabled=false, ...other } = props;
  const classes = useStyles(styles, classesOverride);

  return (
    <ButtonBase
      className={classNames(
        classes.root,
        {
          [classes.colorPrimary]: color === 'primary',
          [classes.colorSecondary]: color === 'primary',
          [classes.colorInherit]: color === 'inherit',
          [classes.disabled]: disabled,
        },
        className,
      )}
      centerRipple
      focusRipple
      disabled={disabled}
      {...other}
    >
      <span className={classes.label}>{children}</span>
    </ButtonBase>
  );
}

export default IconButton;
