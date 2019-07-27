import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    top: 64
  }
})

const NavigationStandalone = ({classes}) => {
  const { TabNavigationMenu } = Components
  return <div className={classes.root}>
    <TabNavigationMenu />
  </div>
}

registerComponent(
  'NavigationStandalone', NavigationStandalone,
  withStyles(styles, { name: 'NavigationStandalone'})
);
