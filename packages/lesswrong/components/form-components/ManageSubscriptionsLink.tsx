import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import Button from '@material-ui/core/Button';

const styles = (theme: ThemeType): JssStyles => ({
  button: {
    marginBottom: theme.spacing.unit,
    marginLeft: theme.spacing.unit
  }
});

const ManageSubscriptionsLink = ({document, removeItem, classes }: {
  document?: any,
  removeItem?: any,
  classes: ClassesType,
}) => {
  return <Link to="/manageSubscriptions">
    <Button color="secondary" variant="outlined"
      className={classes.button}
    >
    Manage Active Subscriptions
    </Button>
  </Link>
};

const ManageSubscriptionsLinkComponent = registerComponent('ManageSubscriptionsLink', ManageSubscriptionsLink, {styles});

declare global {
  interface ComponentTypes {
    ManageSubscriptionsLink: typeof ManageSubscriptionsLinkComponent
  }
}
