import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import StarIcon from '@material-ui/icons/Star';

const styles = (theme) => ({
  icon: {
    fontSize: "1.2rem",
    color: theme.palette.grey[500],
    position: "relative",
    top: 3,
  }
})

const PostsItemCuratedIcon = ({classes, className}) => {
  return <Tooltip title="Curated Post">
      <StarIcon className={classes.icon}/>
    </Tooltip>
}

registerComponent( 'PostsItemCuratedIcon', PostsItemCuratedIcon, withStyles(styles, {name: 'PostsItemCuratedIcon'}))
