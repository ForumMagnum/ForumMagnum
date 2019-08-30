import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = (theme) => ({
  root: {
    color: theme.palette.grey[600],
    fontSize: "1.1rem",
    display: "flex",
    alignItems: "center",
  },
})

const PostsItemMetaInfo = ({children, classes, className}) => {
  return <Typography
    component='span'
    className={classNames(classes.root, className)}
    variant='body1'>
      {children}
  </Typography>
}

registerComponent('PostsItemMetaInfo', PostsItemMetaInfo, withStyles(styles, {name: 'PostsItemMetaInfo'}))
