import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'
import { Typography } from "../common/Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('PostsItemMetaInfo', (theme: ThemeType) => ({
  root: {
    color: theme.palette.text.dim3,
    fontSize: "1.1rem",
    display: "flex",
    alignItems: "center",
  },
}))

const PostsItemMetaInfo = ({children, className}: {
  children?: React.ReactNode,
  className?: string,
}) => {
  const classes = useStyles(styles);

  return <Typography
    component='span'
    className={classNames(classes.root, className)}
    variant='body2'>
      {children}
  </Typography>
}

export default PostsItemMetaInfo;



