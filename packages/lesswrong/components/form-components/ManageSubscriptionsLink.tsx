import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('ManageSubscriptionsLink', (theme: ThemeType) => ({
  root: {
    padding: '10px 0',
  },
  link: {
    display: 'inline-block',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.main,
    textDecoration: 'none',
    padding: '6px 14px',
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 6,
    transition: 'background 0.15s ease, color 0.15s ease',
    '&:hover': {
      background: theme.palette.primary.main,
      color: theme.palette.text.alwaysWhite,
    },
  },
}));

export const ManageSubscriptionsLink = () => {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      <Link to="/manageSubscriptions" className={classes.link}>
        Manage Active Subscriptions
      </Link>
    </div>
  );
};
