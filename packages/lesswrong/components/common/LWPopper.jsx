import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Popper from '@material-ui/core/Popper'
import classNames from 'classnames';

const styles = theme => ({
  popper: {
    position: "absolute",
    zIndex: theme.zIndexes.lwPopper
  },
  tooltip: {
    backgroundColor: "rgba(0,0,0,.6)",
    borderRadius: 3,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontSize: "1rem",
    padding: theme.spacing.unit,
    color: "white",
    zIndex: theme.zIndexes.lwPopperTooltip,
  }
})

// this is a thin wrapper over MuiPopper so that we can set the zIndex however we want
const LWPopper = ({classes, children, tooltip=false, ...props}) => {
  return (
    <Popper className={classNames(classes.popper, {[classes.tooltip]:tooltip})} {...props}>
      <span>{ children }</span>
    </Popper>
  )
};

registerComponent('LWPopper', LWPopper, withStyles(styles, {name:"LWPopper"}));
