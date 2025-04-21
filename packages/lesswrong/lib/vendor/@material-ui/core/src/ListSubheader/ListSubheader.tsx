import React from 'react';
import classNames from 'classnames';
import { capitalize } from '../utils/helpers';
import { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface ListSubheaderProps
  extends StandardProps<React.HTMLAttributes<HTMLDivElement>, ListSubheaderClassKey> {
  color?: 'default' | 'primary' | 'inherit';
  component?: React.ComponentType<ListSubheaderProps>;
  disableGutters?: boolean;
  disableSticky?: boolean;
  inset?: boolean;
}

export type ListSubheaderClassKey =
  | 'root'
  | 'colorPrimary'
  | 'colorInherit'
  | 'inset'
  | 'sticky'
  | 'gutters';

export const styles = defineStyles("MuiListSubheader", theme => ({
  /* Styles applied to the root element. */
  root: {
    boxSizing: 'border-box',
    lineHeight: '48px',
    listStyle: 'none',
    color: theme.palette.text.secondary,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.pxToRem(14),
  },
  /* Styles applied to the root element if `color="primary"`. */
  colorPrimary: {
    color: theme.palette.primary.main,
  },
  /* Styles applied to the root element if `color="inherit"`. */
  colorInherit: {
    color: 'inherit',
  },
  /* Styles applied to the inner `component` element if `disableGutters={false}`. */
  gutters: theme.mixins.gutters(),
  /* Styles applied to the root element if `inset={true}`. */
  inset: {
    paddingLeft: 72,
  },
  /* Styles applied to the root element if `disableSticky={false}`. */
  sticky: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: 'inherit',
  },
}), {stylePriority: -10});

function ListSubheader(props: ListSubheaderProps) {
  const {
    classes: classesOverride,
    className,
    color,
    component: Component,
    disableGutters,
    disableSticky,
    inset,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverride);

  return (
    <Component
      className={classNames(
        classes.root,
        {
          [classes[`color${capitalize(color)}`]]: color !== 'default',
          [classes.inset]: inset,
          [classes.sticky]: !disableSticky,
          [classes.gutters]: !disableGutters,
        },
        className,
      )}
      {...other}
    />
  );
}

ListSubheader.defaultProps = {
  color: 'default',
  component: 'li',
  disableGutters: false,
  disableSticky: false,
  inset: false,
};

ListSubheader.muiName = 'ListSubheader';

export default ListSubheader;
