import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { MetaInfo } from "../../common/MetaInfo";
import { FormatDate } from "../../common/FormatDate";

const styles = (theme: ThemeType) => ({
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
});

export const UserReviewMetadataInner = ({classes, user}: {
  user: SunshineUsersList
  classes: ClassesType<typeof styles>,
}) => {
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

export const UserReviewMetadata = registerComponent('UserReviewMetadata', UserReviewMetadataInner, {styles});



