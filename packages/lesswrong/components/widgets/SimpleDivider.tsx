import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

const styles = defineStyles("SimpleDivider", (theme: ThemeType) => ({
  root: {
    height: 1,
    margin: 0,
    border: 'none',
    flexShrink: 0,
    backgroundColor: theme.palette.greyAlpha(0.12),
  },
}))

/**
 * Derived from the material-UI 'divider' component. This creates a simple
 * horizontal rule; not to be confused with Divider, which puts a fancy logo
 * in the middle.
 */
export const SimpleDividerInner = ({className}: {
  className?: string
}) => {
  const classes = useStyles(styles);
  return <hr className={classNames(classes.root, className)} />;
}

export const SimpleDivider = registerComponent('SimpleDivider', SimpleDividerInner);



