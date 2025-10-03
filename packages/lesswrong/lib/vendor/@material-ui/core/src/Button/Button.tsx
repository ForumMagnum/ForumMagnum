// @inheritedComponent ButtonBase

import React from 'react';
import classNames from 'classnames';
import { fade } from '../styles/colorManipulator';
import ButtonBase from '../ButtonBase';
import type { StandardProps } from '..';
import type { ButtonBaseProps } from '../ButtonBase/ButtonBase';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface ButtonProps extends StandardProps<ButtonBaseProps, ButtonClassKey, 'component'> {
  color?: string;
  disabled?: boolean;
  disableFocusRipple?: boolean;
  disableRipple?: boolean;
  fullWidth?: boolean;
  href?: string;
  mini?: boolean;
  size?: 'small' | 'medium' | 'large';
  type?: "submit"|"reset"|"button";
  variant?: 'text' | 'flat' | 'outlined' | 'contained' | 'raised' | 'fab' | 'extendedFab';
  children: React.ReactNode;
}

export type ButtonClassKey =
  | 'root'
  | 'label'
  | 'text'
  | 'textPrimary'
  | 'textSecondary'
  | 'flat'
  | 'flatPrimary'
  | 'flatSecondary'
  | 'outlined'
  | 'outlinedPrimary'
  | 'outlinedSecondary'
  | 'colorInherit'
  | 'contained'
  | 'containedPrimary'
  | 'containedSecondary'
  | 'raised'
  | 'raisedPrimary'
  | 'raisedSecondary'
  | 'focusVisible'
  | 'disabled'
  | 'fab'
  | 'mini'
  | 'sizeSmall'
  | 'sizeLarge'
  | 'fullWidth';

export const styles = defineStyles("MuiButton", theme => ({
  /* Styles applied to the root element. */
  root: {
    ...theme.typography.button,
    lineHeight: '1.4em', // Improve readability for multiline button.
    boxSizing: 'border-box',
    minWidth: 64,
    minHeight: 36,
    padding: '8px 16px',
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.primary,
    transition: theme.transitions.create(['background-color', 'box-shadow', 'border'], {
      duration: theme.transitions.duration.short,
    }),
    '&:hover': {
      textDecoration: 'none',
      backgroundColor: fade(theme.palette.text.primary, theme.palette.action.hoverOpacity),
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
  /* Styles applied to the span element that wraps the children. */
  label: {
    width: '100%', // assure the correct width for iOS Safari
    display: 'inherit',
    alignItems: 'inherit',
    justifyContent: 'inherit',
  },
  /* Styles applied to the root element if `variant="text"`. */
  text: {},
  /* Styles applied to the root element if `variant="text"` and `color="primary"`. */
  textPrimary: {
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: fade(theme.palette.primary.main, theme.palette.action.hoverOpacity),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
  },
  /* Styles applied to the root element if `variant="text"` and `color="secondary"`. */
  textSecondary: {
    color: theme.palette.secondary.main,
    '&:hover': {
      backgroundColor: fade(theme.palette.secondary.main, theme.palette.action.hoverOpacity),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
  },
  /* Styles applied to the root element for backwards compatibility with legacy variant naming. */
  flat: {},
  /* Styles applied to the root element for backwards compatibility with legacy variant naming. */
  flatPrimary: {},
  /* Styles applied to the root element for backwards compatibility with legacy variant naming. */
  flatSecondary: {},
  /* Styles applied to the root element if `variant="outlined"`. */
  outlined: {
    border: `1px solid ${
      theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)'
    }`,
  },
  /* Styles applied to the root element if `variant="outlined"` and `color="primary"`. */
  outlinedPrimary: {
    border: `1px solid ${fade(theme.palette.primary.main, 0.5)}`,
    '&:hover': {
      border: `1px solid ${theme.palette.primary.main}`,
    },
    '&$disabled': {
      border: `1px solid ${theme.palette.action.disabled}`,
    },
  },
  /* Styles applied to the root element if `variant="outlined"` and `color="secondary"`. */
  outlinedSecondary: {
    border: `1px solid ${fade(theme.palette.secondary.main, 0.5)}`,
    '&:hover': {
      border: `1px solid ${theme.palette.secondary.main}`,
    },
    '&$disabled': {
      border: `1px solid ${theme.palette.action.disabled}`,
    },
  },
  /* Styles applied to the root element if `variant="[contained | fab]"`. */
  contained: {
    color: theme.dark ? theme.palette.greyAlpha(1.0) : theme.palette.greyAlpha(0.87),
    backgroundColor: theme.palette.grey[300],
    boxShadow: theme.shadows[2],
    '&$focusVisible': {
      boxShadow: theme.shadows[6],
    },
    '&:active': {
      boxShadow: theme.shadows[8],
    },
    '&$disabled': {
      color: theme.palette.action.disabled,
      boxShadow: theme.shadows[0],
      backgroundColor: theme.palette.action.disabledBackground,
    },
    '&:hover': {
      backgroundColor: theme.palette.grey.A100,
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: theme.palette.grey[300],
      },
      '&$disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
      },
    },
  },
  /* Styles applied to the root element if `variant="[contained | fab]"` and `color="primary"`. */
  containedPrimary: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: theme.palette.primary.main,
      },
    },
  },
  /* Styles applied to the root element if `variant="[contained | fab]"` and `color="secondary"`. */
  containedSecondary: {
    color: theme.palette.secondary.contrastText,
    backgroundColor: theme.palette.secondary.main,
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: theme.palette.secondary.main,
      },
    },
  },
  /* Styles applied to the root element for backwards compatibility with legacy variant naming. */
  raised: {}, // legacy
  /* Styles applied to the root element for backwards compatibility with legacy variant naming. */
  raisedPrimary: {}, // legacy
  /* Styles applied to the root element for backwards compatibility with legacy variant naming. */
  raisedSecondary: {}, // legacy
  /* Styles applied to the root element if `variant="[fab | extendedFab]"`. */
  fab: {
    borderRadius: '50%',
    padding: 0,
    minWidth: 0,
    width: 56,
    height: 56,
    boxShadow: theme.shadows[6],
    '&:active': {
      boxShadow: theme.shadows[12],
    },
  },
  /* Styles applied to the root element if `variant="extendedFab"`. */
  extendedFab: {
    borderRadius: 48 / 2,
    padding: '0 16px',
    width: 'auto',
    minWidth: 48,
    height: 48,
  },
  /* Styles applied to the ButtonBase root element if the button is keyboard focused. */
  focusVisible: {},
  /* Styles applied to the root element if `disabled={true}`. */
  disabled: {},
  /* Styles applied to the root element if `color="inherit"`. */
  colorInherit: {
    color: 'inherit',
  },
  /* Styles applied to the root element if `size="mini"` & `variant="[fab | extendedFab]"`. */
  mini: {
    width: 40,
    height: 40,
  },
  /* Styles applied to the root element if `size="small"`. */
  sizeSmall: {
    padding: '7px 8px',
    minWidth: 64,
    minHeight: 32,
    fontSize: theme.typography.pxToRem(13),
  },
  /* Styles applied to the root element if `size="large"`. */
  sizeLarge: {
    padding: '8px 24px',
    minWidth: 112,
    minHeight: 40,
    fontSize: theme.typography.pxToRem(15),
  },
  /* Styles applied to the root element if `fullWidth={true}`. */
  fullWidth: {
    width: '100%',
  },
}), {stylePriority: -10});

function Button(props: ButtonProps) {
  const {
    children,
    classes: classesOverride,
    className: classNameProp,
    color='default',
    disabled=false,
    disableFocusRipple=false,
    fullWidth=false,
    focusVisibleClassName,
    mini=false,
    size='medium',
    variant='text',
    type='button',
    ...other
  } = props;
  const classes = useStyles(styles, classesOverride);

  const fab = variant === 'fab' || variant === 'extendedFab';
  const contained = variant === 'contained' || variant === 'raised';
  const text = variant === 'text' || variant === 'flat' || variant === 'outlined';
  const className = classNames(
    classes.root,
    {
      [classes.fab]: fab,
      [classes.mini]: fab && mini,
      [classes.extendedFab]: variant === 'extendedFab',
      [classes.text]: text,
      [classes.textPrimary]: text && color === 'primary',
      [classes.textSecondary]: text && color === 'secondary',
      [classes.flat]: variant === 'text' || variant === 'flat',
      [classes.flatPrimary]: (variant === 'text' || variant === 'flat') && color === 'primary',
      [classes.flatSecondary]: (variant === 'text' || variant === 'flat') && color === 'secondary',
      [classes.contained]: contained || fab,
      [classes.containedPrimary]: (contained || fab) && color === 'primary',
      [classes.containedSecondary]: (contained || fab) && color === 'secondary',
      [classes.raised]: contained || fab,
      [classes.raisedPrimary]: (contained || fab) && color === 'primary',
      [classes.raisedSecondary]: (contained || fab) && color === 'secondary',
      [classes.outlined]: variant === 'outlined',
      [classes.outlinedPrimary]: variant === 'outlined' && color === 'primary',
      [classes.outlinedSecondary]: variant === 'outlined' && color === 'secondary',
      [classes[`sizeSmall`]]: size === 'small',
      [classes[`sizeLarge`]]: size === 'large',
      [classes.disabled]: disabled,
      [classes.fullWidth]: fullWidth,
      [classes.colorInherit]: color === 'inherit',
    },
    classNameProp,
  );

  return (
    <ButtonBase
      className={className}
      disabled={disabled}
      focusRipple={!disableFocusRipple}
      focusVisibleClassName={classNames(classes.focusVisible, focusVisibleClassName)}
      component="button"
      type={type}
      {...other}
    >
      <span className={classes.label}>{children}</span>
    </ButtonBase>
  );
}

export default Button;
