import React from 'react';
import MetaInfo from "../../common/MetaInfo";
import FormatDate from "../../common/FormatDate";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('UserReviewMetadata', (theme: ThemeType) => ({
  root: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  lowRecentKarma: {
    color: theme.palette.warning
  },
  negativeRecentKarma: {
    color: theme.palette.error.dark
  }
}));

export const UserReviewMetadata = ({user}: {
  user: SunshineUsersList
}) => {
  const classes = useStyles(styles);

  return <div className={classes.root}>
    <MetaInfo>
      {user.email}
    </MetaInfo>
    <MetaInfo>
      <FormatDate date={user.createdAt}/>
    </MetaInfo>
    <MetaInfo>
      { user.karma || 0 } karma
    </MetaInfo>
  </div>
}

export default UserReviewMetadata



