import React from 'react';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description'
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message'
import classNames from "classnames";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('FirstContentIcons', (theme: ThemeType) => ({
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3
  },
  commentIcon: {
    marginLeft: -6
  },
}));

export const FirstContentIcons = ({user}: {
  user: SunshineUsersList,
}) => {
  const classes = useStyles(styles);
  const showPostIcon = user.postCount > 0 && !user.reviewedByUserId
  const showCommentIcon = user.commentCount > 0 && !user.reviewedByUserId
  return <span>
    {showPostIcon && <DescriptionIcon className={classes.icon}/>}
    {showCommentIcon && <MessageIcon className={classNames(classes.icon, {[classes.commentIcon]:showPostIcon})}/>}
  </span>;
}

export default FirstContentIcons



