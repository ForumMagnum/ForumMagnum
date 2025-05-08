import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.text.dim3,
    fontSize: "1.1rem",
    display: "flex",
    alignItems: "center",
  },
})

const PostsItemMetaInfoInner = ({children, classes, className}: {
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

export const PostsItemMetaInfo = registerComponent('PostsItemMetaInfo', PostsItemMetaInfoInner, {styles});

declare global {
  interface ComponentTypes {
    PostsItemMetaInfo: typeof PostsItemMetaInfo
  }
}

