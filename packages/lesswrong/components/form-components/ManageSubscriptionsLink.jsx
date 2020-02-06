import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from '../../lib/reactRouterWrapper';
import Button from '@material-ui/core/Button';

const styles = theme => ({
  button: {
    marginBottom: theme.spacing.unit,
    marginLeft: theme.spacing.unit
  }
});

const ManageSubscriptionsLink = ({document, removeItem, classes }) => {
    return <Link to="/manageSubscriptions">
      <Button color="secondary" variant="outlined"
            className={classes.button}
          >
      Manage Active Subscriptions
      </Button>
    </Link>
};
registerComponent('ManageSubscriptionsLink', ManageSubscriptionsLink,
  withStyles(styles, { name: "ManageSubscriptionsLink" })
);
