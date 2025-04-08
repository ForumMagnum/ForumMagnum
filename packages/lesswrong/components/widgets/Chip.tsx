import React, { useRef } from 'react';
import classNames from 'classnames';
import keycode from 'keycode';
import CancelIcon from '@/lib/vendor/@material-ui/core/src/internal/svg-icons/Cancel';
import { emphasize, fade } from '@/lib/vendor/@material-ui/core/src/styles/colorManipulator';
import { defineStyles, useStyles } from '../hooks/useStyles';

export const styles = defineStyles("Chip", theme => {
  const height = 32;
  const backgroundColor =
    theme.palette.type === 'light' ? theme.palette.grey[300] : theme.palette.grey[700];
  const deleteIconColor = fade(theme.palette.text.primary, 0.26);

  return {
    /* Styles applied to the root element. */
    root: {
      fontFamily: theme.typography.fontFamily,
      fontSize: '0.8125rem',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height,
      backgroundColor,
      borderRadius: height / 2,
      whiteSpace: 'nowrap',
      transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
      // label will inherit this from root, then `clickable` class overrides this for both
      cursor: 'default',
      // We disable the focus ring for mouse, touch and keyboard users.
      outline: 'none',
      textDecoration: 'none',
      border: 'none', // Remove `button` border
      padding: 0, // Remove `button` padding
      verticalAlign: 'middle',
      color: theme.palette.text.normal, //Necessary because this uses getContrastText() which produces a non-theme color
    },
    /* Styles applied to the root element if `onClick` is defined or `clickable={true}`. */
    clickable: {
      WebkitTapHighlightColor: 'transparent', // Remove grey highlight
      cursor: 'pointer',
      '&:hover, &:focus': {
        backgroundColor: emphasize(backgroundColor, 0.08),
      },
      '&:active': {
        boxShadow: theme.shadows[1],
        backgroundColor: emphasize(backgroundColor, 0.12),
      },
    },
    /* Styles applied to the root element if `onDelete` is defined. */
    deletable: {
      '&:focus': {
        backgroundColor: emphasize(backgroundColor, 0.08),
      },
    },
    /* Styles applied to the root element if `onDelete` and `color="primary"` is defined. */
    deletableColorPrimary: {
      '&:focus': {
        backgroundColor: emphasize(theme.palette.primary.main, 0.2),
      },
    },
    /* Styles applied to the root element if `onDelete` and `color="secondary"` is defined. */
    deletableColorSecondary: {
      '&:focus': {
        backgroundColor: emphasize(theme.palette.secondary.main, 0.2),
      },
    },
    /* Styles applied to the root element if `variant="outlined"`. */
    outlined: {
      backgroundColor: 'transparent',
      border: `1px solid ${theme.palette.greyAlpha(0.23)}`,
      '$clickable&:hover, $clickable&:focus, $deletable&:focus': {
        backgroundColor: fade(theme.palette.text.primary, 0.08),
      },
    },
    /* Styles applied to the root element if `variant="outlined"` and `color="primary"`. */
    outlinedPrimary: {
      color: theme.palette.primary.main,
      border: `1px solid ${theme.palette.primary.main}`,
      '$clickable&:hover, $clickable&:focus, $deletable&:focus': {
        backgroundColor: fade(theme.palette.primary.main, 0.08),
      },
    },
    /* Styles applied to the root element if `variant="outlined"` and `color="secondary"`. */
    outlinedSecondary: {
      color: theme.palette.secondary.main,
      border: `1px solid ${theme.palette.secondary.main}`,
      '$clickable&:hover, $clickable&:focus, $deletable&:focus': {
        backgroundColor: fade(theme.palette.secondary.main, 0.08),
      },
    },
    /* Styles applied to the `icon` element. */
    icon: {
      color: theme.palette.type === 'light' ? theme.palette.grey[700] : theme.palette.grey[300],
      marginLeft: 4,
      marginRight: -8,
    },
    /* Styles applied to the label `span` element`. */
    label: {
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 12,
      paddingRight: 12,
      userSelect: 'none',
      whiteSpace: 'nowrap',
      cursor: 'inherit',
    },
    /* Styles applied to the `deleteIcon` element. */
    deleteIcon: {
      // Remove grey highlight
      WebkitTapHighlightColor: 'transparent',
      color: deleteIconColor,
      cursor: 'pointer',
      height: 'auto',
      margin: '0 4px 0 -8px',
      '&:hover': {
        color: fade(deleteIconColor, 0.4),
      },
    },
  };
});

/**
 * Derived from material-UI's Chip component (with a bunch of unused stuff
 * deleted).
 * Chips represent complex entities in small blocks, such as a contact.
 */
export function Chip(props: {
  clickable?: boolean;
  deleteIcon?: React.ReactElement<any>;
  label?: React.ReactNode;
  onDelete?: React.EventHandler<any>;
  variant?: 'default' | 'outlined';
} & React.HTMLAttributes<HTMLDivElement>) {
  const chipRef = useRef<HTMLDivElement|null>(null);
  const classes = useStyles(styles);
  const handleDeleteIconClick = (event: React.MouseEvent) => {
    // Stop the event from bubbling up to the `Chip`
    event.stopPropagation();
    const { onDelete } = props;
    if (onDelete) {
      onDelete(event);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { onKeyDown } = props;
    if (onKeyDown) {
      onKeyDown(event);
    }

    // Ignore events from children of `Chip`.
    if (event.currentTarget !== event.target) {
      return;
    }

    const key = keycode(event as any);
    if (key === 'space' || key === 'enter' || key === 'backspace' || key === 'esc') {
      event.preventDefault();
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { onClick, onDelete, onKeyUp } = props;

    if (onKeyUp) {
      onKeyUp(event);
    }

    // Ignore events from children of `Chip`.
    if (event.currentTarget !== event.target) {
      return;
    }

    const key = keycode(event as any);

    if (onClick && (key === 'space' || key === 'enter')) {
      onClick(event as any);
    } else if (onDelete && key === 'backspace') {
      onDelete(event);
    } else if (key === 'esc' && chipRef.current) {
      chipRef.current?.blur();
    }
  };

  const {
    className: classNameProp,
    clickable=false,
    deleteIcon: deleteIconProp,
    label,
    onClick,
    onDelete,
    onKeyDown,
    onKeyUp,
    tabIndex: tabIndexProp,
    variant='default',
    ...other
  } = props;

  const className = classNames(
    classes.root,
    {
      [classes.clickable]: onClick || clickable,
      [classes.deletable]: onDelete,
      [classes.outlined]: variant === 'outlined',
    },
    classNameProp,
  );

  let deleteIcon = null;
  if (onDelete) {

    deleteIcon = <CancelIcon
      className={classes.deleteIcon}
      onClick={handleDeleteIconClick}
    />
  }

  let tabIndex = tabIndexProp;

  if (!tabIndex) {
    tabIndex = onClick || onDelete || clickable ? 0 : -1;
  }

  return (
    <div
      role="button"
      className={className}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      ref={chipRef}
      {...other}
    >
      <span className={classes.label}>{label}</span>
      {deleteIcon}
    </div>
  );
}
