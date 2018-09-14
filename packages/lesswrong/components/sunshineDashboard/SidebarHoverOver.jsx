import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.grey[50],
    padding: theme.spacing.unit*2,
    border: "solid 1px rgba(0,0,0,.1)",
    boxShadow: "-3px 0 5px 0px rgba(0,0,0,.1)",
  }
})

const SidebarHoverOver = ({children, classes, width=500}) => {
  return <div className={classes.root} style={{width:width}}>
      { children }
  </div>
};

SidebarHoverOver.displayName = "SidebarHoverOver";

registerComponent('SidebarHoverOver', SidebarHoverOver, withStyles(styles, { name: 'SidebarHoverOver'}));
