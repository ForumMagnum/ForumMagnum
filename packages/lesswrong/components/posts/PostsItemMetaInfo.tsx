import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'
import { Typography } from "../common/Typography";

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
  return <Typography
    component='span'
    className={classNames(classes.root, className)}
    variant='body2'>
      {children}
  </Typography>
}

export const PostsItemMetaInfo = registerComponent('PostsItemMetaInfo', PostsItemMetaInfoInner, {styles});



