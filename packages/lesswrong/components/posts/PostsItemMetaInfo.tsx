import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames'

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.text.dim3,
    fontSize: "1.1rem",
    display: "flex",
    alignItems: "center",
  },
})

const PostsItemMetaInfo = ({children, classes, className}: {
  children?: React.ReactNode,
  classes: ClassesType<typeof styles>,
  className?: string,
}) => {
  return <Components.Typography
    component='span'
    className={classNames(classes.root, className)}
    variant='body2'>
      {children}
  </Components.Typography>
}

const PostsItemMetaInfoComponent = registerComponent('PostsItemMetaInfo', PostsItemMetaInfo, {styles});

declare global {
  interface ComponentTypes {
    PostsItemMetaInfo: typeof PostsItemMetaInfoComponent
  }
}

