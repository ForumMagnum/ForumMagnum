import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    position: "absolute",
    top:0,
    right:0,
    height:"100%",
    display:"flex",
    alignItems: "center",
    backgroundColor: theme.palette.grey[50],
    paddingLeft: theme.spacing.unit*2
  },
})

const SidebarActionMenu = ({children, classes}) => {
  return <div className={classes.root}>
        { children }
    </div>
};

SidebarActionMenu.propTypes = {
  classes: PropTypes.object.isRequired
};

SidebarActionMenu.displayName = "SidebarActionMenu";

registerComponent('SidebarActionMenu', SidebarActionMenu, withStyles(styles, { name: 'SidebarActionMenu'}));
