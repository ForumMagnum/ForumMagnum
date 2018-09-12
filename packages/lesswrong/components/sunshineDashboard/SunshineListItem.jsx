import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    borderTop: "solid 1px rgba(0,0,0,.1)",
    padding: "2px 0 2px 15px"
  }
})

const SunshineListItem = ({children, classes}) => {
  return <div className={classes.root}>
        { children }
      </div>
};

SunshineListItem.displayName = "SunshineListItem";

registerComponent('SunshineListItem', SunshineListItem, withStyles(styles, { name: 'SunshineListItem'}));
