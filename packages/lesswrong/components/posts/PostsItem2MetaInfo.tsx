import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';
import { Typography } from "../common/Typography";
import { isIfAnyoneBuildsItFrontPage } from '../seasonal/styles';

const styles = (theme: ThemeType) => ({
  metaInfo: {
    color: theme.palette.text.dim3,
    ...isIfAnyoneBuildsItFrontPage({
      color: theme.palette.text.bannerAdOverlay,
    }),
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

export default registerComponent("PostsItem2MetaInfo", PostsItem2MetaInfo, {styles});
  

