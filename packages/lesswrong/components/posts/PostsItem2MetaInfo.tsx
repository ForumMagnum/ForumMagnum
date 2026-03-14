import React from 'react';
import classNames from 'classnames';
import { Typography } from "../common/Typography";
import { isIfAnyoneBuildsItFrontPage } from '../seasonal/styles';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("PostsItem2MetaInfo", (theme: ThemeType) => ({
  metaInfo: {
    color: theme.palette.text.dim3,
    ...isIfAnyoneBuildsItFrontPage({
      color: theme.palette.text.bannerAdOverlay,
    }),
    fontSize: theme.isFriendlyUI ? "13px" : "1.1rem",
    textAlign: "center",
    flexShrink: 0,
    flexGrow: 0,
  }
}));

const PostsItem2MetaInfo = ({children, className}: {
  children?: React.ReactNode,
  className?: string,
  read?: boolean,
}) => {
  const classes = useStyles(styles);

  return <Typography
    component='span'
    className={classNames(classes.metaInfo, className)}
    variant='body2'>
      {children}
  </Typography>
}

export default PostsItem2MetaInfo
  

