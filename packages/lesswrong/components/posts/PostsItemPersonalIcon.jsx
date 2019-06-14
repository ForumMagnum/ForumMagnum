import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import PersonIcon from '@material-ui/icons/Person';

const styles = (theme) => ({
  icon: {
    fontSize: "1.2rem",
    color: theme.palette.grey[500],
    position: "relative",
    top: 3,
  }
})

const PostsItemPersonalIcon = ({classes, className}) => {
  return <Tooltip title="Personal Blogpost">
      <PersonIcon className={classes.icon}/>
    </Tooltip>
}

registerComponent( 'PostsItemPersonalIcon', PostsItemPersonalIcon, withStyles(styles, {name: 'PostsItemPersonalIcon'}))
