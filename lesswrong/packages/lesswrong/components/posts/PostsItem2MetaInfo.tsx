import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';
import { Typography } from "@/components/common/Typography";

const styles = (theme: ThemeType) => ({
  metaInfo: {
    color: theme.palette.text.dim3,
    fontSize: isFriendlyUI ? "13px" : "1.1rem",
    textAlign: "center",
    flexShrink: 0,
    flexGrow: 0,
  }
});

const PostsItem2MetaInfo = ({children, className, classes}: {
  children?: React.ReactNode,
  className?: string,
  classes: ClassesType<typeof styles>,
  read?: boolean,
}) => {
  return <Typography
    component='span'
    className={classNames(classes.metaInfo, className)}
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

export default PostsItem2MetaInfoComponent;
