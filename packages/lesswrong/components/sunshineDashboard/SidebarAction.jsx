import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';
import Tooltip from '@material-ui/core/Tooltip';

const styles = (theme) => ({
  root: {
    marginRight: theme.spacing.unit*2,
    fontSize:"1.5em",
    cursor:"pointer",
    opacity:.4,
    "&:hover": {
      opacity:.8,
    },
    "&:hover $warningHighlight": {
      display: "block"
    }
  },
  warningHighlight: {
    display:"none",
    background:"rgba(255,50,0,.2)",
    position:"absolute",
    top:0,
    right:0,
    width:250,
    height:"100%",
    pointerEvents: "none"
  },
  tooltip: {
    fontSize: '.9rem',
  }
})

const SidebarAction = ({children, classes, title, warningHighlight, onClick}) => {
  return <Tooltip title={title} placement="bottom" classes={{tooltip: classes.tooltip}} enterDelay={200}>
          <Icon onClick={onClick} className={classes.root}>
            {children}
            {warningHighlight && <div className={classes.warningHighlight}/>}
          </Icon>
        </Tooltip>
}

registerComponent( 'SidebarAction', SidebarAction, withStyles(styles, {name: 'SidebarAction'}))
