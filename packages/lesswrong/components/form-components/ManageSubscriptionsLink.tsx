import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('ManageSubscriptionsLink', (theme: ThemeType) => ({
  button: {
    marginBottom: theme.spacing.unit,
    marginLeft: theme.spacing.unit
  }
}));

export const ManageSubscriptionsLink = () => {
  const classes = useStyles(styles);

  return <Link to="/manageSubscriptions">
    <Button color="secondary" variant="outlined"
      className={classes.button}
    >
    Manage Active Subscriptions
    </Button>
  </Link>
};

