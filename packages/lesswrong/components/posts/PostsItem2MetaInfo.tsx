import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  metaInfo: {
    color: theme.palette.text.dim3,
    fontSize: isFriendlyUI ? "13px" : "1.1rem",
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
  return <Components.Typography
    component='span'
    className={classNames(classes.metaInfo, {[classes.read]: read}, className)}
    variant='body2'>
      {children}
  </Components.Typography>
}

const PostsItem2MetaInfoComponent = registerComponent("PostsItem2MetaInfo", PostsItem2MetaInfo, {styles});
  
declare global {
  interface ComponentTypes {
    PostsItem2MetaInfo: typeof PostsItem2MetaInfoComponent
  }
}
