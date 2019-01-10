import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
});

const KarmaChangeNotifier = ({classes, currentUser}) => {
  if (!currentUser) return <div/>
  const karmaChanges = currentUser.karmaChanges;
  if (!karmaChanges) return <div/>
  
  return <div className={classes.root}>{karmaChanges.totalChange}</div>;
}

registerComponent('KarmaChangeNotifier', KarmaChangeNotifier,
  withStyles(styles, {name: 'KarmaChangeNotifier'}));