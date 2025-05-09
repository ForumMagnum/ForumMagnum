import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import type { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface CardContentProps
  extends StandardProps<React.HTMLAttributes<HTMLDivElement>, CardContentClassKey> {
}

export type CardContentClassKey = 'root';

export const styles = defineStyles("MuiCardContent", theme => ({
  /* Styles applied to the root element. */
  root: {
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    paddingTop: 16,
    paddingBottom: 16,
    '&:last-child': {
      paddingBottom: 24,
    },
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing.unit * 3,
      paddingRight: theme.spacing.unit * 3,
    },
  },
}), {stylePriority: -10});

function CardContent(props: CardContentProps) {
  const { classes: classesOverride, className, ...other } = props;
  const classes = useStyles(styles, classesOverride);

  return <div className={classNames(classes.root, className)} {...other} />;
}

export default CardContent;
