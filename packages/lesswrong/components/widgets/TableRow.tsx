import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { TableLvl2Context } from './TableBody';

export const styles = defineStyles("TableRow", theme => ({
  /* Styles applied to the root element. */
  root: {
    color: 'inherit',
    display: 'table-row',
    height: 48,
    verticalAlign: 'middle',
    // We disable the focus ring for mouse, touch and keyboard users.
    outline: 'none',
    '&$selected': {
      backgroundColor:
        theme.palette.type === 'light'
          ? 'rgba(0, 0, 0, 0.04)' // grey[100]
          : 'rgba(255, 255, 255, 0.08)',
    },
    '&$hover:hover': {
      backgroundColor:
        theme.palette.type === 'light'
          ? 'rgba(0, 0, 0, 0.07)' // grey[200]
          : 'rgba(255, 255, 255, 0.14)',
    },
  },
  /* Styles applied to the root element if `selected={true}`. */
  selected: {},
  /* Styles applied to the root element if `hover={true}`. */
  hover: {},
  /* Styles applied to the root element if table variant = 'head'. */
  head: {
    height: 56,
  },
  /* Styles applied to the root element if table variant = 'footer'. */
  footer: {
    height: 56,
  },
}));

/**
 * Will automatically set dynamic row height
 * based on the material table element parent (head, body, etc).
 */
export function TableRow(props: {
  hover?: boolean
  selected?: boolean
  className?: string
  children?: React.ReactNode,
}) {
  const classes = useStyles(styles);
  const {
    className: classNameProp,
    hover=false,
    selected=false,
    children,
  } = props;
  const tablelvl2 = useContext(TableLvl2Context);

  const className = classNames(
    classes.root,
    {
      [classes.head]: tablelvl2 && tablelvl2 === 'head',
      [classes.footer]: tablelvl2 && tablelvl2 === 'footer',
      [classes.hover]: hover,
      [classes.selected]: selected,
    },
    classNameProp,
  );

  return <tr className={className}>
    {children}
  </tr>
}

TableRow.contextTypes = {
  tablelvl2: PropTypes.object,
};
