import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';

const styles = (theme) => ({
  icon: {
    fontSize: "1rem",
    color: theme.palette.grey[500],
    top: 0,
  }
})

const PostsItemAlignmentIcon = ({classes, className}) => {
  const { OmegaIcon } = Components
  return <Tooltip title="Crossposted from AlignmentForum.org">
      <OmegaIcon className={classes.icon}/>
    </Tooltip>

}

registerComponent( 'PostsItemAlignmentIcon', PostsItemAlignmentIcon, withStyles(styles, {name: 'PostsItemAlignmentIcon'}))
