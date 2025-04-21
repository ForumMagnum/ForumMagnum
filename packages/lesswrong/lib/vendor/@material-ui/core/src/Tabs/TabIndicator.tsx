import React from 'react';
import classNames from 'classnames';
import { capitalize } from '../utils/helpers';
import { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface TabIndicatorProps
  extends StandardProps<React.HTMLAttributes<HTMLDivElement>, TabIndicatorClassKey> {
  color: 'secondary' | 'primary' | string;
  style: { left: number; width: number };
}

export type TabIndicatorClassKey = 'root' | 'colorSecondary' | 'colorPrimary';

export const styles = defineStyles("MuiTabIndicator", theme => ({
  /* Styles applied to the root element. */
  root: {
    position: 'absolute',
    height: 2,
    bottom: 0,
    width: '100%',
    transition: theme.transitions.create(),
    willChange: 'left, width',
  },
  /* Styles applied to the root element if `color="primary"`. */
  colorPrimary: {
    backgroundColor: theme.palette.primary.main,
  },
  /* Styles applied to the root element if `color="secondary"`. */
  colorSecondary: {
    backgroundColor: theme.palette.secondary.main,
  },
}), {stylePriority: -10});

function TabIndicator(props: TabIndicatorProps) {
  const { classes: classesOverride, className, color, ...other } = props;
  const classes = useStyles(styles, classesOverride);

  return (
    <span
      className={classNames(classes.root, classes[`color${capitalize(color)}`], className)}
      {...other}
    />
  );
}

export default TabIndicator;
