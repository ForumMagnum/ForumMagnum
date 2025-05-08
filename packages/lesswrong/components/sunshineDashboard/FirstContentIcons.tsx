import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description'
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message'
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

export const FirstContentIconsInner = ({user, classes}: {
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

export const FirstContentIcons = registerComponent('FirstContentIcons', FirstContentIconsInner, {styles});

declare global {
  interface ComponentTypes {
    FirstContentIcons: typeof FirstContentIcons
  }
}

