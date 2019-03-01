import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import StarIcon from '@material-ui/icons/Star';

const styles = (theme) => ({
  icon: {
    fontSize: "1.3rem",
    color: theme.palette.grey[500],
    height: 22,
    marginRight: theme.spacing.unit/2
  }
})

const PostsItemCuratedIcon = ({classes, className}) => {
  return <Tooltip title="Curated Post">
      <StarIcon className={classes.icon}/> 
    </Tooltip>
}

registerComponent( 'PostsItemCuratedIcon', PostsItemCuratedIcon, withStyles(styles, {name: 'PostsItemCuratedIcon'}))
