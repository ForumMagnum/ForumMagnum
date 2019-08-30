import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames';

const styles = theme => ({
  metaInfo: {
    color: theme.palette.grey[600],
    fontSize: "1.1rem",
    textAlign: "center",
    flexShrink: 0,
    flexGrow: 0,
  },
});

const PostsItem2MetaInfo = ({children, className, classes}) => {
  return <Typography
    component='span'
    className={classNames(classes.metaInfo, className)}
    variant='body1'>
      {children}
  </Typography>
}

registerComponent("PostsItem2MetaInfo", PostsItem2MetaInfo,
  withStyles(styles, { name: "PostsItem2MetaInfo" }));
