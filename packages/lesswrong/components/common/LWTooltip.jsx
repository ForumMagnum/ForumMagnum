import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  tooltip: {
    fontSize: "1rem",
  }
})

const LWTooltip = (props) => {
  return <Tooltip {...props} classes={{tooltip: props.classes.tooltip}}>
    { props.children }
  </Tooltip>
};

registerComponent('LWTooltip', LWTooltip, withStyles(styles, {name: 'LWTooltip'}));
