import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';

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
  const { MetaInfo, FormatDate } = Components
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

declare global {
  interface ComponentTypes {
    UserReviewMetadata: typeof UserReviewMetadata
  }
}

