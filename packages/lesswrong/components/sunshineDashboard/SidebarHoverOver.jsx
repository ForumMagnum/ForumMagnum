import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';

const styles = theme => ({
  root: {
    position:"relative",
    "&:hover": {
      backgroundColor: grey[50]
    }
  },
  hoverOver: {
    display:"inline",
    background: grey[50],
    padding: "10px 20px 10px 10px",
    border: "solid 1px rgba(0,0,0,.1)",
    boxShadow: "-3px 0 5px 0px rgba(0,0,0,.1)",
    position: "absolute",
    right:250,
    top:-1,
    width:500,
    zIndex: 1,

    "& img": {
      maxWidth: "100%",
    },
  }
})

const SidebarHoverOver = ({children, classes, hoverOverComponent, width=500}) => {
  return <div className={classes.root}>
    <Components.HoverOver
      hoverOverComponent={
        <div className={classes.hoverOver} style={{width:width}}>
          { hoverOverComponent }
        </div>}
    >
      { children }
    </Components.HoverOver>
  </div>
};

SidebarHoverOver.displayName = "SidebarHoverOver";

registerComponent('SidebarHoverOver', SidebarHoverOver, withStyles(styles, { name: 'SidebarHoverOver'}));
