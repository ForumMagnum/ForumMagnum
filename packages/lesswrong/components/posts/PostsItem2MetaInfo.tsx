import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { createStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames';

const styles = createStyles(theme => ({
  metaInfo: {
    color: theme.palette.grey[600],
    fontSize: "1.1rem",
    textAlign: "center",
    flexShrink: 0,
    flexGrow: 0,
  }
}));

const PostsItem2MetaInfo = ({children, className, classes, read}: {
  children?: any,
  className?: string,
  classes: any,
  read?: boolean,
}) => {
  return <Typography
    component='span'
    className={classNames(classes.metaInfo, {[classes.read]: read}, className)}
    variant='body2'>
      {children}
  </Typography>
}

const PostsItem2MetaInfoComponent = registerComponent("PostsItem2MetaInfo", PostsItem2MetaInfo, {styles});
  
declare global {
  interface ComponentTypes {
    PostsItem2MetaInfo: typeof PostsItem2MetaInfoComponent
  }
}

