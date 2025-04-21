import React from 'react';
import classNames from 'classnames';
import { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface ToolbarProps
  extends StandardProps<React.HTMLAttributes<HTMLDivElement>, ToolbarClassKey> {
  variant?: 'regular' | 'dense';
  disableGutters?: boolean;
  children: React.ReactNode
}

export type ToolbarClassKey = 'root' | 'gutters' | 'regular' | 'dense';

export const styles = defineStyles("MuiToolbar", theme => ({
  /* Styles applied to the root element. */
  root: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  /* Styles applied to the root element if `disableGutters={false}`. */
  gutters: theme.mixins.gutters(),
  /* Styles applied to the root element if `variant="regular"`. */
  regular: theme.mixins.toolbar,
  /* Styles applied to the root element if `variant="dense"`. */
  dense: {
    minHeight: 48,
  },
}), {stylePriority: -10});

function Toolbar(props: ToolbarProps) {
  const { children, classes: classesOverride, className: classNameProp, disableGutters=false, variant="regular", ...other } = props;
  const classes = useStyles(styles, classesOverride);

  const className = classNames(
    classes.root,
    classes[variant],
    {
      [classes.gutters]: !disableGutters,
    },
    classNameProp,
  );

  return (
    <div className={className} {...other}>
      {children}
    </div>
  );
}

export default Toolbar;
