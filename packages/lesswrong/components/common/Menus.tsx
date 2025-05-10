import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import ButtonBase from '@/lib/vendor/@material-ui/core/src/ButtonBase';
import { isLW } from '@/lib/instanceSettings';
import { isFriendlyUI } from '@/themes/forumTheme';

export const styles = defineStyles("MenuItem", theme => ({
  root: {
    ...theme.typography.subheading,
    height: 24,
    boxSizing: 'content-box',
    width: 'auto',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    paddingLeft: 16,
    paddingRight: 16,
    
    ...(isLW && {
      fontFamily: theme.palette.fonts.sansSerifStack,
      color: theme.palette.grey[800],
      fontSize: 14.3,
      lineHeight: "1.1em",
    }),
    ...(isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack,
      color: theme.palette.grey[900],
      fontWeight: 500,
      fontSize: 14.3,
    }),
  },
  /* Styles applied to the (normally root) `component` element. May be wrapped by a `container`. */
  listRoot: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    textDecoration: 'none',
    textAlign: 'left',
    paddingTop: 12,
    paddingBottom: 12,
    transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    '&:hover': {
      textDecoration: 'none',
      backgroundColor: theme.palette.greyAlpha(0.1),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
    ...(isLW && {
      paddingTop: 8,
      paddingBottom: 8
    }),
  },
  listDense: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  listDisabled: {
    opacity: 0.5,
  },
}),  {stylePriority: -1});


const MenuItemInner = ({value, disabled, disableRipple, dense, onClick, className, children}: {
  value?: string|number,
  disabled?: boolean,
  disableRipple?: boolean,
  dense?: boolean
  onClick?: (event: React.MouseEvent) => void,
  className?: string,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);

  return <ButtonBase
    className={classNames(
      className,
      classes.root,
      classes.listRoot,
      {
        [classes.listDense]: dense,
        [classes.listDisabled]: disabled,
      },
    )}
    disabled={disabled}
    disableRipple={disableRipple}
    onClick={onClick}
    value={value}
    component={'li'}
  >
    {children}
  </ButtonBase>;
}

const MenuItemLinkInner = ({to, className, disabled, disableTouchRipple, children}: {
  to: string,
  className?: string,
  disabled?: boolean,
  disableTouchRipple?: boolean,
  onClick?: (event: React.MouseEvent) => void,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const ButtonBaseUntyped: any = ButtonBase

  return <ButtonBaseUntyped
    className={classNames(
      classes.root,
      classes.listRoot,
      disabled && classes.listDisabled,
      className,
    )}
    disabled={disabled}
    disableTouchRipple={disableTouchRipple}
    component={Link}
    to={to}
  >
    {children}
  </ButtonBaseUntyped>;
}

export const MenuItem = registerComponent("MenuItem", MenuItemInner);
export const MenuItemLink = registerComponent("MenuItemLink", MenuItemLinkInner);


