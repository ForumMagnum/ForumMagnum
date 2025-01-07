import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';

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

export const UserReviewMetadata = ({classes, user}: {
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

const UserReviewMetadataComponent = registerComponent('UserReviewMetadata', UserReviewMetadata, {styles});

declare global {
  interface ComponentTypes {
    UserReviewMetadata: typeof UserReviewMetadataComponent
  }
}

