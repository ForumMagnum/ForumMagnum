import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    borderTop: "solid 1px rgba(0,0,0,.1)",
    padding: "4px 0 3px 12px",
    '&:hover': {
      background: "rgb(250,250,250)",
    }
  }
})

const SunshineListItem = ({children, classes}) => {
  return <div className={classes.root}>
        { children }
      </div>
};

SunshineListItem.displayName = "SunshineListItem";

registerComponent('SunshineListItem', SunshineListItem, withStyles(styles, { name: 'SunshineListItem'}));
