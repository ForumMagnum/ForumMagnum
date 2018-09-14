import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    position: "absolute",
    top:0,
    right:0,
    height:"100%",
    display:"flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: theme.palette.grey[50],
    paddingLeft: theme.spacing.unit*2
  },
})

const SidebarItemActions = ({children, classes}) => {
  return <div className={classes.root}>
        { children }
    </div>
};

SidebarItemActions.displayName = "SidebarItemActions";

registerComponent('SidebarItemActions', SidebarItemActions, withStyles(styles, { name: 'SidebarItemActions'}));
