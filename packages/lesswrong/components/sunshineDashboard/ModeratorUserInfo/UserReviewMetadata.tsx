import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
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
  classes: ClassesType,
}) => {
  const { MetaInfo, FormatDate } = Components
  return <div className={classes.root}>
    <MetaInfo>
      {user.email}
    </MetaInfo>
    <MetaInfo className={classes.info}>
      <FormatDate date={user.createdAt}/>
    </MetaInfo>
    <MetaInfo className={classes.info}>
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

