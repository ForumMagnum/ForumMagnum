import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import DescriptionIcon from '@material-ui/icons/Description'
import MessageIcon from '@material-ui/icons/Message'
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3
  },
  commentIcon: {
    marginLeft: -6
  },
});

export const FirstContentIcons = ({user, classes}: {
  user: SunshineUsersList,
  classes: ClassesType<typeof styles>,
}) => {
  const showPostIcon = user.postCount > 0 && !user.reviewedByUserId
  const showCommentIcon = user.commentCount > 0 && !user.reviewedByUserId
  return <span>
    {showPostIcon && <DescriptionIcon className={classes.icon}/>}
    {showCommentIcon && <MessageIcon className={classNames(classes.icon, {[classes.commentIcon]:showPostIcon})}/>}
  </span>;
}

const FirstContentIconsComponent = registerComponent('FirstContentIcons', FirstContentIcons, {styles});

declare global {
  interface ComponentTypes {
    FirstContentIcons: typeof FirstContentIconsComponent
  }
}

