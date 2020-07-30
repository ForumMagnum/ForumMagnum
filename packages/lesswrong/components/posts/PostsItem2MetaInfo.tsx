import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  metaInfo: {
    color: theme.palette.grey[600],
    fontSize: "1.1rem",
    textAlign: "center",
    flexShrink: 0,
    flexGrow: 0,
  }
});

const PostsItem2MetaInfo = ({children, className, classes, read}: {
  children?: React.ReactNode,
  className?: string,
  classes: ClassesType,
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

